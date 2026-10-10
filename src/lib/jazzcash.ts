// JazzCash REST API v1.1 integration (mobile-wallet / MWALLET flow).
//
// How it works:
//  1. Checkout calls initiateJazzCashPayment(order) → builds the signed request.
//  2. In DEMO mode we render our own test payment screen (no real credentials needed).
//  3. In REAL mode the customer is POSTed (auto-submitted form) to JazzCash's endpoint,
//     which shows JazzCash's own page asking for the customer's JazzCash mobile number + MPIN.
//  4. JazzCash then POSTs the result to JAZZCASH_RETURN_URL (/api/payments/jazzcash/callback),
//     which verifies pp_SecureHash and marks the order paid.
//
// GOING LIVE: the client must get a *merchant* account from JazzCash
// (https://www.jazzcash.com.pk) and fill Merchant ID / Password / Integrity Salt in
// Admin → Settings (or the JAZZCASH_* env vars), set JAZZCASH_SANDBOX=false and
// JAZZCASH_DEMO_MODE=false. The return URL must be a public HTTPS URL.
import crypto from "crypto";
import { getSetting } from "./settings";

export interface JazzCashConfig {
  merchantId: string;
  password: string;
  integritySalt: string;
  sandbox: boolean;
  demoMode: boolean;
  returnUrl: string;
}

export async function getJazzCashConfig(): Promise<JazzCashConfig> {
  const [merchantId, password, integritySalt, sandbox, demoMode, returnUrl] = await Promise.all([
    getSetting("jazzcash_merchant_id", process.env.JAZZCASH_MERCHANT_ID || ""),
    getSetting("jazzcash_password", process.env.JAZZCASH_PASSWORD || ""),
    getSetting("jazzcash_integrity_salt", process.env.JAZZCASH_INTEGRITY_SALT || ""),
    getSetting("jazzcash_sandbox", process.env.JAZZCASH_SANDBOX || "true"),
    getSetting("jazzcash_demo_mode", process.env.JAZZCASH_DEMO_MODE || "true"),
    getSetting("jazzcash_return_url", process.env.JAZZCASH_RETURN_URL || ""),
  ]);
  return {
    merchantId,
    password,
    integritySalt,
    sandbox: sandbox === "true",
    demoMode: demoMode === "true",
    returnUrl,
  };
}

export function jazzcashEndpoint(sandbox: boolean): string {
  return sandbox
    ? "https://sandbox.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction"
    : "https://payments.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction";
}

/** JazzCash wants timestamps as YYYYMMDDHHMMSS (Pakistan time). */
export function jazzcashTimestamp(date: Date = new Date()): string {
  // JazzCash operates on PKT (UTC+5)
  const pkt = new Date(date.getTime() + 5 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${pkt.getUTCFullYear()}${p(pkt.getUTCMonth() + 1)}${p(pkt.getUTCDate())}` +
    `${p(pkt.getUTCHours())}${p(pkt.getUTCMinutes())}${p(pkt.getUTCSeconds())}`
  );
}

/**
 * Builds the pp_SecureHash. Per JazzCash docs: take all request fields except
 * pp_SecureHash, sort alphabetically, join as "key=value&...", prepend the
 * integrity salt as "salt&sortedString", HMAC-SHA256, uppercase hex.
 */
export function computeSecureHash(params: Record<string, string>, integritySalt: string): string {
  const sorted = Object.keys(params)
    .filter((k) => k !== "pp_SecureHash")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const message = `${integritySalt}&${sorted}`;
  return crypto.createHmac("sha256", integritySalt).update(message).digest("hex").toUpperCase();
}

export interface PaymentInit {
  orderId: number;
  orderNumber: string;
  amountPkr: number; // whole rupees
  description: string;
  customerMobile?: string;
}

export async function buildJazzCashRequest(init: PaymentInit) {
  const cfg = getJazzCashConfig ? await getJazzCashConfig() : null;
  if (!cfg) throw new Error("JazzCash config unavailable");
  if (!cfg.merchantId || !cfg.password || !cfg.integritySalt) {
    throw new Error(
      "JazzCash credentials are not configured. Set them in Admin → Settings (or JAZZCASH_* env vars)."
    );
  }
  const now = new Date();
  const txnRef = `TXN${now.getTime()}${init.orderId}`; // unique per attempt
  const params: Record<string, string> = {
    pp_Version: "1.1",
    pp_TxnType: "MWALLET",
    pp_Language: "EN",
    pp_MerchantID: cfg.merchantId,
    pp_SubMerchantID: "",
    pp_Password: cfg.password,
    pp_BankID: "",
    pp_ProductID: "",
    pp_TxnRefNo: txnRef,
    pp_Amount: String(init.amountPkr * 100), // JazzCash expects paisa
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: jazzcashTimestamp(now),
    pp_BillReference: init.orderNumber,
    pp_Description: init.description.slice(0, 60),
    pp_TxnExpiryDateTime: jazzcashTimestamp(new Date(now.getTime() + 60 * 60 * 1000)), // 1h
    pp_ReturnURL: cfg.returnUrl,
    pp_SecureHash: "",
    ppmpf_1: String(init.orderId),
    ppmpf_2: init.customerMobile || "",
    ppmpf_3: "",
    ppmpf_4: "",
    ppmpf_5: "",
  };
  params.pp_SecureHash = computeSecureHash(params, cfg.integritySalt);
  return { endpoint: jazzcashEndpoint(cfg.sandbox), params, txnRef, config: cfg };
}

/** Verifies a callback POST from JazzCash by recomputing pp_SecureHash. */
export async function verifyJazzCashCallback(body: Record<string, string>): Promise<boolean> {
  const cfg = await getJazzCashConfig();
  const received = (body.pp_SecureHash || "").toUpperCase();
  if (!received || !cfg.integritySalt) return false;
  const expected = computeSecureHash(body, cfg.integritySalt);
  // timing-safe compare
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
