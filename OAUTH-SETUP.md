# BABLI Admin — Google + Facebook Login Setup

Is se admin panel (`https://erzo.me/admin/login`) me **"Continue with Google"** aur
**"Continue with Facebook"** ke buttons aa jayenge. Password login bhi kaam
karta rahega (backup).

**Security:** sirf `ADMIN_EMAIL` wali email (tumhari admin email) se login
hoga — koi aur Google/Facebook account try karega to **"Not authorized"**
message ke sath reject ho jayega.

**Redirect URIs** (neeche dono consoles me EXACT yehi paste karne hain):
- `https://erzo.me/api/auth/callback/google`
- `https://erzo.me/api/auth/callback/facebook`

---

## Part 1 — Google OAuth client (Google Cloud Console)

1. https://console.cloud.google.com/ kholo aur apni Gmail se sign in karo.
2. Top-left project dropdown → **New Project** → naam `Babli Store` → **Create**.
3. Left menu → **APIs & Services** → **OAuth consent screen**:
   - User type: **External** → **Create**
   - App name: `Babli Store`, User support email: apni email → **Save and Continue**
   - Scopes step me kuch change nahi → **Save and Continue**
   - Test users: apni Gmail add karo → **Save and Continue** → **Back to Dashboard**
4. Left menu → **Credentials** → **+ Create Credentials** → **OAuth client ID**:
   - Application type: **Web application**
   - Name: `Babli Web`
   - **Authorized redirect URIs** → **+ Add URI** → paste karo:
     `https://erzo.me/api/auth/callback/google`
   - **Create** dabao
5. Ek popup me **Client ID** aur **Client secret** milega — dono copy karke
   kahin safe note kar lo (yehi `.env` me jayenge).

## Part 2 — Facebook App (developers.facebook.com)

1. https://developers.facebook.com/ kholo → **My Apps** → **Create App**.
2. App type: **Other** → Next → Business type: **None** (ya jo suit kare) →
   App name: `Babli Store` → **Create app**.
3. Dashboard me **Add Product** → **Facebook Login** → **Set up**.
4. Left menu → **Facebook Login** → **Settings**:
   - **Valid OAuth Redirect URIs** me paste karo:
     `https://erzo.me/api/auth/callback/facebook`
   - **Save Changes**.
5. Left menu → **Settings** → **Basic** → **App ID** aur **App Secret** copy karo
   (App Secret dekhne ke liye **Show** dabana parega + Facebook password).
   - App ID → `FACEBOOK_CLIENT_ID`
   - App Secret → `FACEBOOK_CLIENT_SECRET`
6. **IMPORTANT:** App abhi **Development mode** me hai — is mode me sirf tum
   (aur jo log tum **Roles → Test Users** me add karo) login kar sakte ho,
   jo admin ke liye kaafi hai. Agar kabhi public karna ho to top ka
   **App Mode** switch **Live** karo.

## Part 3 — Server pe values lagana (cPanel)

1. Apne computer ke terminal me ye command chalao taake secret bane:
   `openssl rand -base64 32`
   Jo lambi value aaye wo copy karo.
2. cPanel → **Setup Node.js App** → apni `babli` app → **Environment Variables**
   me ye add karo (purani values rehne do, sirf ye naye add karo):
   - `ADMIN_EMAIL` = `bafarwazeer@gmail.com` (agar pehle se nahi hai)
   - `GOOGLE_CLIENT_ID` = Part 1 wala Client ID
   - `GOOGLE_CLIENT_SECRET` = Part 1 wala Client secret
   - `FACEBOOK_CLIENT_ID` = Part 2 wala App ID
   - `FACEBOOK_CLIENT_SECRET` = Part 2 wala App Secret
   - `NEXTAUTH_SECRET` = terminal wali generated value
   - `NEXTAUTH_URL` = `https://erzo.me`
3. **App ko RESTART karo** (Stop → Start) — warna naye variables load nahi honge.

## Part 4 — Test

1. `https://erzo.me/admin/login` kholo — Google/Facebook ke buttons nazar aayenge.
   (Agar credentials set nahi to buttons nazar nahi aayenge — ye normal hai.)
2. **"Continue with Google"** dabao → apni admin Gmail select karo → tum
   seedha admin panel me honge.
3. Kisi **doosri** Gmail se try karo → **"Not authorized"** aana chahiye. ✅

## Troubleshooting

- **"redirect_uri_mismatch" (Google):** redirect URI me spelling/HTTPS check karo —
  bilkul `https://erzo.me/api/auth/callback/google` hona chahiye.
- **Facebook "Can't load URL":** Valid OAuth Redirect URIs me
  `https://erzo.me/api/auth/callback/facebook` add karna bhool gaye.
- **Buttons nahi dikh rahe:** env variables set hain? App restart ki?
- **"Not authorized" apni email pe bhi:** `ADMIN_EMAIL` ki spelling/case check
  karo — cPanel env me bilkul sahi email honi chahiye.
