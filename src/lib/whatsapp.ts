// WhatsApp helpers — floating button + "order on WhatsApp" deep links.

export interface WhatsAppOrderLine {
  name: string;
  size: string;
  qty: number;
  price: number; // PKR each
}

export interface WhatsAppOrder {
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  items: WhatsAppOrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: string;
}

export function formatPkr(n: number): string {
  return "Rs " + n.toLocaleString("en-PK");
}

/** Builds a wa.me link with the full order composed as a message. */
export function buildWhatsAppOrderLink(ownerNumber: string, order: WhatsAppOrder): string {
  const lines = order.items.map(
    (i, idx) => `${idx + 1}. ${i.name} (Size: ${i.size}) x${i.qty} — ${formatPkr(i.price * i.qty)}`
  );
  const msg = [
    `*New Order ${order.orderNumber}*`,
    ``,
    ...lines,
    ``,
    `Subtotal: ${formatPkr(order.subtotal)}`,
    `Shipping: ${formatPkr(order.shipping)}`,
    `*Total: ${formatPkr(order.total)}*`,
    ``,
    `Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}, ${order.city}`,
    `Payment: ${order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod === "jazzcash" ? "JazzCash" : "WhatsApp"}`,
  ].join("\n");
  const clean = ownerNumber.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

/** Generic "chat with us" link for the floating button. */
export function buildWhatsAppChatLink(ownerNumber: string, text = "Assalam o Alaikum! I have a question about your store."): string {
  return `https://wa.me/${ownerNumber.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
