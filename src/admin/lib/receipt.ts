import type { ReceiptSettings } from "./qz"

/** Only the order fields a receipt shows (AdminOrder has them all). */
export type ReceiptOrder = {
  display_id?: number | null
  created_at: string | Date
  currency_code: string
  email?: string | null
  items?: { title: string; variant_title?: string | null; quantity: number; total: number }[] | null
  subtotal?: number
  discount_total?: number
  shipping_total?: number
  tax_total?: number
  total: number
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)

/** A plain, black-on-white receipt that thermal printers render crisply. Amounts are in major units (Medusa v2). */
export function receiptHtml(order: ReceiptOrder, s: ReceiptSettings): string {
  const money = (n = 0) => new Intl.NumberFormat(undefined, { style: "currency", currency: order.currency_code.toUpperCase() }).format(n)
  const row = (label: string, value: string, bold = false) =>
    `<tr${bold ? ' style="font-weight:700;font-size:15px"' : ""}><td>${esc(label)}</td><td style="text-align:right;white-space:nowrap">${esc(value)}</td></tr>`
  const lines = (order.items ?? [])
    .map((i) => row(`${i.quantity} x ${i.title}${i.variant_title ? ` (${i.variant_title})` : ""}`, money(i.total)))
    .join("")
  const totals = [
    row("Subtotal", money(order.subtotal)),
    order.discount_total ? row("Discount", `-${money(order.discount_total)}`) : "",
    order.shipping_total ? row("Shipping", money(order.shipping_total)) : "",
    row("Tax", money(order.tax_total)),
    row("Total", money(order.total), true),
  ].join("")
  const date = new Date(order.created_at).toLocaleString()
  return `<html><body style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#000">
${s.header ? `<div style="text-align:center;font-weight:700;font-size:17px;margin-bottom:4px">${esc(s.header)}</div>` : ""}
<div style="text-align:center">Order #${order.display_id ?? ""}<br>${esc(date)}</div>
<hr style="border:0;border-top:1px dashed #000">
<table style="width:100%;border-collapse:collapse">${lines}</table>
<hr style="border:0;border-top:1px dashed #000">
<table style="width:100%;border-collapse:collapse">${totals}</table>
${s.footer ? `<div style="text-align:center;margin-top:10px">${esc(s.footer)}</div>` : ""}
</body></html>`
}
