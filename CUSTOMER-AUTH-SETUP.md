# BABLI — Customer Accounts + Newsletter Setup

Is update me **customer accounts** (signup/login with email verification, forgot password)
aur **newsletter subscription** (double opt-in + admin panel) add hua hai.

## Tumhe kya karna hai (2 kaam)

### 1. SMTP credentials banana (emails bhejne ke liye)

Customer verification emails, password reset links aur newsletter confirmation
emails ke liye ek email account chahiye jo SMTP se bhej sake.

**Gmail se (sab se easy):**
1. https://myaccount.google.com/ → **Security** → **2-Step Verification** ON karo (agar off hai)
2. Phir https://myaccount.google.com/apppasswords kholo
3. App name: `Babli Store` → **Create** → 16-letter ka **App Password** milega (spaces ke baghair note karo)

**cPanel email se (alternative):**
1. cPanel → **Email Accounts** → naya account banao (e.g. `noreply@erzo.me`)
2. Us ka password note karo

### 2. cPanel me values lagana

cPanel → **Setup Node.js App** → `babli` app → **Environment Variables** me ye add karo:

| Variable | Value |
|---|---|
| `SMTP_HOST` | Gmail: `smtp.gmail.com` · cPanel: `mail.erzo.me` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | tumhari email (e.g. `noreply@erzo.me` ya Gmail address) |
| `SMTP_PASS` | App Password (Gmail) ya email account ka password |
| `SMTP_FROM` | bhejne wali email (e.g. `Babli <noreply@erzo.me>`) — optional |
| `SITE_URL` | `https://erzo.me` |

Phir **app RESTART karo** (Stop → Start) — warna naye variables load nahi honge.

## Deploy steps

1. `babli-deploy-accounts.zip` download karo
2. cPanel → File Manager → `babli` folder → ZIP upload → **Extract** (overwrite)
3. Setup Node.js App → `npm install --omit=dev`
4. Upar wali SMTP variables add karo
5. **App restart** (Stop → Start)

## Test karna

1. `https://erzo.me/account` kholo → **Sign up** → apna naam/email/password
2. Inbox check karo → verification link dabao → account verify + auto sign-in
3. Header me apne naam ka pehla letter wala icon aana chahiye
4. **Forgot password** try karo → 1-hour reset link
5. Footer me newsletter email daalo → inbox me confirmation link → confirm karo
6. Admin panel → **Newsletter** page → subscriber list + **Export CSV**
7. Checkout pe **email (optional)** + **newsletter checkbox** dikhna chahiye

## SMTP ke baghair kya hoga?

Agar SMTP set nahi to site **crash nahi karegi**:
- Signup → account **auto-verify** ho ke sign-in ho jayega
- Newsletter → **auto-confirm** ho jayega
- Emails **console me log** hongi (cPanel → Node.js app → logs me dekh sakte ho)

Lekin real customers ke liye SMTP lagana zaroori hai — warna unhe verification
email nahi jayegi.

## Security notes

- Passwords **bcrypt** se hashed hain (plain text kahin save nahi hota)
- Verification tokens **24 hours** me expire, reset tokens **1 hour** me, single-use
- Newsletter **double opt-in** — bina confirm kiye koi email list me "active" nahi hota
- Har newsletter email ke neeche **unsubscribe link** lagana na bhoolo:
  `https://erzo.me/api/newsletter/unsubscribe?token=SUBSCRIBER_TOKEN`
  (har subscriber ka apna token admin panel ke export me nahi — link email me bhejo)
- Guest checkout pehle jaisa hi kaam karta hai — account banana **optional** hai
