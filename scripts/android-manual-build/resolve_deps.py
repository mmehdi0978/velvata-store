#!/usr/bin/env python3
"""Minimal Maven dependency resolver: walks POMs, downloads aar/jar files."""
import os, sys, re, urllib.request, xml.etree.ElementTree as ET

OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/apkbuild/deps"
os.makedirs(OUT, exist_ok=True)

GOOGLE = "https://dl.google.com/dl/android/maven2"
CENTRAL = "https://repo1.maven.org/maven2"

NS = {"m": "http://maven.apache.org/POM/4.0.0"}

def gav_path(g, a, v, ext):
    return f"{g.replace('.', '/')}/{a}/{v}/{a}-{v}.{ext}"

def fetch(url, retries=4):
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except Exception as e:
            last = e
    raise last

def get_pom(g, a, v):
    for base in (GOOGLE, CENTRAL):
        url = f"{base}/{gav_path(g, a, v, 'pom')}"
        try:
            return fetch(url), base
        except Exception:
            continue
    raise RuntimeError(f"POM not found: {g}:{a}:{v}")

def text(el, tag):
    c = el.find(f"m:{tag}", NS)
    return c.text.strip() if c is not None and c.text else ""

def parse_pom(data):
    root = ET.fromstring(data)
    props = {}
    for p in root.findall("m:properties", NS):
        for child in p:
            tag = child.tag.split("}")[-1]
            props[tag] = (child.text or "").strip()
    parent = root.find("m:parent", NS)
    packaging = text(root, "packaging") or "jar"
    deps = []
    dm = {}
    for section, path in (("dependencyManagement", "m:dependencyManagement/m:dependencies/m:dependency"),
                         ("dependencies", "m:dependencies/m:dependency")):
        for d in root.findall(path, NS):
            scope = text(d, "scope") or "compile"
            if section == "dependencyManagement":
                dm[(text(d, "groupId"), text(d, "artifactId"))] = text(d, "version")
            else:
                if scope in ("test", "provided", "system"):
                    continue
                if text(d, "optional") == "true":
                    continue
                deps.append({
                    "g": text(d, "groupId"), "a": text(d, "artifactId"),
                    "v": text(d, "version"), "scope": scope,
                    "type": text(d, "type") or "jar",
                    "excl": [(text(e, "groupId"), text(e, "artifactId"))
                             for e in d.findall("m:exclusions/m:exclusion", NS)],
                })
    return props, deps, dm, packaging

def subst(s, props):
    def rep(m):
        return props.get(m.group(1), m.group(0))
    for _ in range(5):
        s2 = re.sub(r"\$\{([^}]+)\}", rep, s)
        if s2 == s:
            break
        s = s2
    return s

resolved = {}   # (g,a) -> (v, base, ext)
queue = []

ROOTS = [
    ("androidx.appcompat", "appcompat", "1.7.1"),
    ("androidx.coordinatorlayout", "coordinatorlayout", "1.3.0"),
    ("androidx.core", "core-splashscreen", "1.2.0"),
    ("androidx.core", "core", "1.17.0"),
    ("androidx.activity", "activity", "1.11.0"),
    ("androidx.fragment", "fragment", "1.8.9"),
    ("androidx.webkit", "webkit", "1.14.0"),
    ("androidx.browser", "browser", "1.9.0"),
    ("org.apache.cordova", "framework", "14.0.1"),
]

for g, a, v in ROOTS:
    queue.append((g, a, v, {}))

while queue:
    g, a, v, parent_excl = queue.pop(0)
    key = (g, a)
    if key in resolved:
        continue
    data, base = get_pom(g, a, v)
    props, deps, dm, packaging = parse_pom(data)
    # resolve property placeholders in versions
    ext = "aar" if packaging == "aar" else "jar"
    resolved[key] = (v, base, ext)
    print(f"resolved {g}:{a}:{v} [{ext}]")
    for d in deps:
        dg, da = d["g"], d["a"]
        if (dg, da) in parent_excl or any((dg == eg and (da == ea or ea == "*")) for eg, ea in d["excl"]):
            continue
        dv = subst(d["v"], props)
        if not dv:
            dv = dm.get((dg, da), "")
            dv = subst(dv, props)
        dv = dv.strip().strip("[]()")  # version range like [1.7.1] -> 1.7.1
        if "," in dv:  # range like [1.0,2.0) -> take lower bound
            dv = dv.split(",")[0].strip()
        if not dv or "${" in dv:
            print(f"  WARN: no version for {dg}:{da}, skipping")
            continue
        if (dg, da) not in resolved:
            queue.append((dg, da, dv, {}))

print(f"\nTotal: {len(resolved)} artifacts. Downloading...")
for (g, a), (v, base, ext) in resolved.items():
    url = f"{base}/{gav_path(g, a, v, ext)}"
    dest = os.path.join(OUT, f"{a}-{v}.{ext}")
    if not os.path.exists(dest):
        try:
            data = fetch(url)
            open(dest, "wb").write(data)
            print(f"  ok {a}-{v}.{ext} ({len(data)//1024}KB)")
        except Exception as e:
            print(f"  FAIL {url}: {e}")
    # also grab sources? no. also try jar for aar (classes are inside aar anyway)

# write manifest list
with open(os.path.join(OUT, "artifacts.txt"), "w") as f:
    for (g, a), (v, base, ext) in sorted(resolved.items()):
        f.write(f"{g}:{a}:{v}:{ext}\n")
print("done ->", OUT)
