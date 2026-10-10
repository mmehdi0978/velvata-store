#!/usr/bin/env python3
"""Manual APK assembly without Gradle: aapt2 + javac + d8 + apksigner."""
import os, sys, subprocess, shutil, re, zipfile, glob
import xml.etree.ElementTree as ET

PROJ = os.path.expanduser("~/workspace/client-garments-store")
APP = os.path.join(PROJ, "android/app/src/main")
SDK = "/opt/android-sdk"
BT = os.path.join(SDK, "build-tools/34.0.0")
ANDROID_JAR = os.path.join(SDK, "platforms/android-36/android.jar")
AAPT2 = os.path.join(BT, "aapt2")
D8 = os.path.join(SDK, "build-tools/36.0.0/d8")
ZIPALIGN = os.path.join(BT, "zipalign")
APKSIGNER = os.path.join(BT, "apksigner")
DEPS = "/tmp/apkbuild/deps"
AARS = "/tmp/apkbuild/aar"
WORK = "/tmp/apkbuild/work"
PKG = "pk.libaascollection.store"

def run(cmd, **kw):
    print("+", " ".join(cmd[:6]), "..." if len(cmd) > 6 else "")
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        print(r.stdout[-3000:]); print(r.stderr[-3000:])
        raise RuntimeError(f"failed: {cmd[0]}")
    return r

shutil.rmtree(WORK, ignore_errors=True)
os.makedirs(WORK)
os.chdir(WORK)

# ---- 1. collect library info from AARs ----
lib_pkgs, lib_res, lib_jars = [], [], []
for d in sorted(glob.glob(os.path.join(AARS, "*"))):
    man = os.path.join(d, "AndroidManifest.xml")
    pkg = None
    if os.path.exists(man):
        try:
            root = ET.parse(man).getroot()
            pkg = root.get("package")
        except Exception:
            pass
    if pkg:
        lib_pkgs.append(pkg)
    res = os.path.join(d, "res")
    if os.path.isdir(res):
        lib_res.append(res)
    cj = os.path.join(d, "classes.jar")
    if os.path.exists(cj):
        lib_jars.append(cj)
print(f"libs: {len(lib_pkgs)} pkgs, {len(lib_res)} res dirs, {len(lib_jars)} classes.jars")

# extra plain jars (kotlin-stdlib etc.), skipping known duplicates
skip = {"kotlinx-coroutines-core-1.8.1.jar"}  # -jvm variant covers it
plain_jars = [j for j in sorted(glob.glob(os.path.join(DEPS, "*.jar"))) if os.path.basename(j) not in skip]

# ---- 2. manifest ----
man_src = open(os.path.join(APP, "AndroidManifest.xml")).read()
man_src = man_src.replace("${applicationId}", PKG)
man_src = man_src.replace("<manifest ", f'<manifest package="{PKG}" ', 1)
man_src = man_src.replace("<manifest\n", f'<manifest package="{PKG}"\n', 1)
# add versionCode/versionName
man_src = re.sub(r"<manifest([^>]*)>", rf'<manifest\1 android:versionCode="1" android:versionName="1.0">', man_src, count=1)
mtag = man_src[man_src.index("<manifest"):man_src.index(">", man_src.index("<manifest"))+1]
if "xmlns:android" not in mtag:
    raise RuntimeError("manifest missing xmlns")
open("AndroidManifest.xml", "w").write(man_src)
print("manifest prepared")

# ---- 3. filter lib resources: app resources override library ones (Gradle semantics) ----
def values_keys(resdir):
    keys = set()
    for entry in os.listdir(resdir):
        if entry == "values" or entry.startswith("values-"):
            vdir = os.path.join(resdir, entry)
            if os.path.isdir(vdir):
                for fn in os.listdir(vdir):
                    if fn.endswith(".xml"):
                        try:
                            for el in ET.parse(os.path.join(vdir, fn)).getroot():
                                name = el.get("name")
                                if name:
                                    keys.add((el.tag, name))
                        except Exception:
                            pass
    return keys

def file_keys(resdir):
    keys = set()
    for entry in os.listdir(resdir):
        full = os.path.join(resdir, entry)
        if os.path.isdir(full) and not (entry == "values" or entry.startswith("values-")):
            rtype = entry.split("-")[0]
            for fn in os.listdir(full):
                keys.add((rtype, os.path.splitext(fn)[0]))
    return keys

CORE_RES = os.path.join(PROJ, "node_modules/@capacitor/android/capacitor/src/main/res")
lib_pkgs.append("com.getcapacitor.android")

STAGE = "stage"
shutil.rmtree(STAGE, ignore_errors=True)
os.makedirs(STAGE)
seen_values = values_keys(os.path.join(APP, "res"))
seen_files = file_keys(os.path.join(APP, "res"))
shutil.copytree(os.path.join(APP, "res"), os.path.join(STAGE, "app-res"))

def stage_lib(resdir, idx):
    dest = os.path.join(STAGE, f"lib{idx}")
    os.makedirs(dest, exist_ok=True)
    # process default "values" BEFORE qualified "values-*" so defaults survive
    entries = sorted(os.listdir(resdir), key=lambda e: (0 if e == "values" else 1, e))
    for entry in entries:
        src = os.path.join(resdir, entry)
        if not os.path.isdir(src):
            continue
        if entry == "values" or entry.startswith("values-"):
            d = os.path.join(dest, entry)
            os.makedirs(d, exist_ok=True)
            for fn in os.listdir(src):
                if not fn.endswith(".xml"):
                    continue
                try:
                    tree = ET.parse(os.path.join(src, fn))
                    root = tree.getroot()
                    removed = False
                    for el in list(root):
                        name = el.get("name")
                        if name and (el.tag, name) in seen_values:
                            root.remove(el)
                            removed = True
                    if removed:
                        ET.register_namespace("tools", "http://schemas.android.com/tools")
                        tree.write(os.path.join(d, fn), encoding="utf-8", xml_declaration=True)
                    else:
                        shutil.copy(os.path.join(src, fn), os.path.join(d, fn))
                    for el in root:
                        if el.get("name"):
                            seen_values.add((el.tag, el.get("name")))
                except Exception as e:
                    print("values filter warn:", e)
        else:
            rtype = entry.split("-")[0]
            d = os.path.join(dest, entry)
            os.makedirs(d, exist_ok=True)
            for fn in os.listdir(src):
                key = (rtype, os.path.splitext(fn)[0])
                if key in seen_files:
                    continue
                seen_files.add(key)
                shutil.copy(os.path.join(src, fn), os.path.join(d, fn))

staged = [os.path.join(STAGE, "app-res")]
for i, rd in enumerate(lib_res + [CORE_RES]):
    stage_lib(rd, i)
    staged.append(os.path.join(STAGE, f"lib{i}"))

# ---- 4. aapt2 compile (each res dir into its OWN subdir to avoid .flat name collisions) ----
os.makedirs("compiled", exist_ok=True)
for i, rd in enumerate(staged):
    outdir = f"compiled/r{i}"
    os.makedirs(outdir, exist_ok=True)
    run([AAPT2, "compile", "--dir", rd, "-o", outdir + "/"])

# ---- 5. aapt2 link ----
flats = []
for i in range(len(staged)):
    flats += sorted(glob.glob(f"compiled/r{i}/*.flat"))
link_cmd = [AAPT2, "link", "-o", "app-unsigned.apk",
            "-I", ANDROID_JAR,
            "--manifest", "AndroidManifest.xml",
            "--min-sdk-version", "24",
            "--target-sdk-version", "36",
            "--java", "gen/",
            "--extra-packages", ":".join(lib_pkgs)] + flats
run(link_cmd)
print("aapt2 link OK")

# ---- 5. javac ----
srcs = []
for base in [os.path.join(APP, "java"),
             os.path.join(PROJ, "node_modules/@capacitor/android/capacitor/src/main/java"),
             os.path.join(PROJ, "node_modules/@capacitor/app/android/src/main/java"),
             os.path.join(PROJ, "node_modules/@capacitor/browser/android/src/main/java"),
             os.path.join(PROJ, "node_modules/@capacitor/status-bar/android/src/main/java")]:
    for dp, _, fns in os.walk(base):
        for fn in fns:
            if fn.endswith(".java"):
                srcs.append(os.path.join(dp, fn))
for dp, _, fns in os.walk("gen"):
    for fn in fns:
        if fn.endswith(".java"):
            srcs.append(os.path.join(dp, fn))
print(f"javac sources: {len(srcs)}")
os.makedirs("classes", exist_ok=True)
cp = [ANDROID_JAR] + lib_jars + plain_jars
open("sources.txt", "w").write("\n".join(srcs))
run(["javac", "--release", "17", "-nowarn",
     "-cp", ":".join(cp), "-d", "classes", "@sources.txt"])
print("javac OK")

# ---- 6. d8 ----
# dedupe: unzip all program jars/classes into one dir, first wins
os.makedirs("dexinput", exist_ok=True)
def unzip_first(zpath, dest):
    with zipfile.ZipFile(zpath) as z:
        for info in z.infolist():
            if info.is_dir() or not info.filename.endswith(".class"):
                continue
            if "module-info.class" in info.filename or "META-INF" in info.filename:
                continue
            out = os.path.join(dest, info.filename)
            if os.path.exists(out):
                continue
            os.makedirs(os.path.dirname(out), exist_ok=True)
            with z.open(info) as src, open(out, "wb") as dst:
                dst.write(src.read())
# app classes first
for dp, _, fns in os.walk("classes"):
    for fn in fns:
        if fn.endswith(".class"):
            src = os.path.join(dp, fn)
            rel = os.path.relpath(src, "classes")
            out = os.path.join("dexinput", rel)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            shutil.copy(src, out)
for j in lib_jars + plain_jars:
    unzip_first(j, "dexinput")
ncls = sum(1 for _, _, fns in os.walk("dexinput") for f in fns if f.endswith(".class"))
print(f"dex input classes: {ncls}")
shutil.make_archive("dexinput", "zip", "dexinput")
os.makedirs("dexout", exist_ok=True)
run([D8, "--lib", ANDROID_JAR, "--min-api", "24", "--output", "dexout/",
     "dexinput.zip"])
print("d8 OK ->", os.listdir("dexout"))

# ---- 7. assemble APK: add dex + web assets ----
shutil.copy("app-unsigned.apk", "app.apk")
with zipfile.ZipFile("app.apk", "a", zipfile.ZIP_DEFLATED) as z:
    for dp, _, fns in os.walk("dexout"):
        for fn in fns:
            if fn.endswith(".dex"):
                z.write(os.path.join(dp, fn), fn)
    webroot = os.path.join(APP, "assets")
    for dp, _, fns in os.walk(webroot):
        for fn in fns:
            full = os.path.join(dp, fn)
            arc = os.path.relpath(full, webroot)
            z.write(full, "assets/" + arc)
print("apk assembled")

# ---- 8. zipalign + sign ----
keystore = "/tmp/apkbuild/debug.keystore"
if not os.path.exists(keystore):
    run(["keytool", "-genkeypair", "-keystore", keystore, "-storepass", "android",
         "-alias", "androiddebugkey", "-keypass", "android",
         "-dname", "CN=Android Debug,O=Android,C=US",
         "-keyalg", "RSA", "-keysize", "2048", "-validity", "10950"])
run([ZIPALIGN, "-f", "4", "app.apk", "app-aligned.apk"])
run([APKSIGNER, "sign", "--ks", keystore, "--ks-pass", "pass:android",
     "--key-pass", "pass:android", "--out", "app-debug.apk", "app-aligned.apk"])
run([APKSIGNER, "verify", "--print-certs", "app-debug.apk"])
sz = os.path.getsize("app-debug.apk")
print(f"\nSUCCESS: /tmp/apkbuild/work/app-debug.apk ({sz//1024} KB)")
