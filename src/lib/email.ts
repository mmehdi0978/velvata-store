import nodemailer from "nodemailer";

export interface OrderAlertData {
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
  paymentMethod: string;
  items: { name: string; size: string; qty: number; price: number }[];
  subtotal: number;
  shipping: number;
  total: number;
}

const DEFAULT_SMTP_USER = "bafarwazeer@gmail.com";
const DEFAULT_SMTP_HOST = "smtp.gmail.com";

function getTransport() {
  const user = process.env.SMTP_USER || DEFAULT_SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || DEFAULT_SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function smtpConfigured(): boolean {
  return !!((process.env.SMTP_USER || DEFAULT_SMTP_USER) && process.env.SMTP_PASS);
}

function fromAddress(): string {
  return process.env.SMTP_FROM || process.env.SMTP_USER || DEFAULT_SMTP_USER;
}

// Generic mail sender. Fire-and-forget: never throws.
// If SMTP is not configured, logs the email to console (dev fallback).
export async function sendMail(opts: { to: string; subject: string; text: string; html?: string }): Promise<boolean> {
  try {
    const transport = getTransport();
    if (!transport) {
      console.log(`[email:dev-fallback] To: ${opts.to}\nSubject: ${opts.subject}\n${opts.text}\n---`);
      return false;
    }
    await transport.sendMail({ from: fromAddress(), to: opts.to, subject: opts.subject, text: opts.text, html: opts.html });
    console.log(`email sent to ${opts.to}: ${opts.subject}`);
    return true;
  } catch (e) {
    console.error("sendMail failed", e);
    return false;
  }
}

export function isSmtpConfigured(): boolean {
  return smtpConfigured();
}

const STORE = () => process.env.STORE_NAME || "Velvata";

export async function sendVerificationEmail(to: string, name: string, link: string): Promise<boolean> {
  const store = STORE();
  return sendMail({
    to,
    subject: `Verify your ${store} account`,
    text:
      `Hi ${name || "there"},\n\n` +
      `Welcome to ${store}! Please verify your email address by clicking this link (valid for 24 hours):\n\n${link}\n\n` +
      `If you didn't create this account, just ignore this email.\n\n— Team ${store}`,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, link: string): Promise<boolean> {
  const store = STORE();
  return sendMail({
    to,
    subject: `Reset your ${store} password`,
    text:
      `Hi ${name || "there"},\n\n` +
      `You asked to reset your ${store} account password. Click this link (valid for 1 hour):\n\n${link}\n\n` +
      `If you didn't ask for this, just ignore this email — your password won't change.\n\n— Team ${store}`,
  });
}

export async function sendNewsletterConfirmEmail(to: string, link: string): Promise<boolean> {
  const store = STORE();
  return sendMail({
    to,
    subject: `Confirm your ${store} newsletter subscription`,
    text:
      `Hi there,\n\n` +
      `Please confirm your subscription to the ${store} newsletter (new arrivals & exclusive offers) by clicking this link:\n\n${link}\n\n` +
      `If you didn't ask for this, just ignore this email.\n\n— Team ${store}`,
  });
}

// Fire-and-forget: never throws.
export async function sendLoginAlert(info: {
  email: string;
  name: string;
  ip: string;
  userAgent: string;
  time: string;
}): Promise<void> {
  try {
    const transport = getTransport();
    if (!transport) {
      console.log("login alert skipped: SMTP_USER/SMTP_PASS not set");
      return;
    }
    const from = process.env.SMTP_USER as string;
    const to = process.env.ALERT_EMAIL || "admin@tarm.foo";
    const text =
      `Admin panel login detected\n\n` +
      `Account: ${info.name} <${info.email}>\n` +
      `Time: ${info.time}\n` +
      `IP address: ${info.ip}\n` +
      `Browser: ${info.userAgent}\n\n` +
      `If this wasn't you, change your admin password immediately.`;
    await transport.sendMail({
      from,
      to,
      subject: `Admin login: ${info.email} (${info.ip})`,
      text,
    });
    console.log("login alert sent to", to);
  } catch (e) {
    console.error("login alert failed", e);
  }
}
export async function sendOrderAlert(o: OrderAlertData): Promise<void> {
  try {
    const transport = getTransport();
    if (!transport) {
      console.log("order alert skipped: SMTP_USER/SMTP_PASS not set");
      return;
    }
    const from = process.env.SMTP_USER as string;
    const to = process.env.ALERT_EMAIL || "admin@tarm.foo";
    const lines = o.items
      .map((i) => `- ${i.name} (${i.size}) x ${i.qty} = Rs ${i.price * i.qty}`)
      .join("\n");
    const text =
      `New order received: ${o.orderNumber}\n\n` +
      `Customer: ${o.customerName}\n` +
      `Phone: ${o.phone}\n` +
      `Address: ${o.address}, ${o.city}\n` +
      `Notes: ${o.notes || "-"}\n` +
      `Payment: ${o.paymentMethod}\n\n` +
      `Items:\n${lines}\n\n` +
      `Subtotal: Rs ${o.subtotal}\n` +
      `Shipping: Rs ${o.shipping}\n` +
      `Total: Rs ${o.total}\n\n` +
      `View in admin panel: /admin`;
    await transport.sendMail({ from, to, subject: `New order ${o.orderNumber} — Rs ${o.total}`, text });
    console.log("order alert sent to", to);
  } catch (e) {
    console.error("order alert failed (order was still placed)", e);
  }
}

export async function sendNewCustomerAlert(name: string, email: string): Promise<void> {
  try {
    const transport = getTransport();
    if (!transport) {
      console.log("new-customer alert skipped: SMTP not configured");
      return;
    }
    const from = process.env.SMTP_USER as string;
    const to = process.env.ALERT_EMAIL || process.env.ADMIN_EMAIL || from;
    const text =
      `New customer account created on ${STORE()}.\n\n` +
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Time: ${new Date().toLocaleString()}\n\n` +
      `View all customers: /admin/customers`;
    await transport.sendMail({ from, to, subject: `New customer: ${name} (${email})`, text });
    console.log("new-customer alert sent to", to);
  } catch (e) {
    console.error("new-customer alert failed (signup was still completed)", e);
  }
}
