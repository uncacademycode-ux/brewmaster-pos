import { formatCurrency } from "@/lib/cart-store";
import type { Order } from "@/lib/types";

export function Receipt({ order }: { order: Order }) {
  const dt = new Date(order.created_at);
  return (
    <div className="receipt-print hidden print:block">
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 16 }}>BREW HOUSE</div>
      <div style={{ textAlign: "center", fontSize: 11 }}>123 Rue du Café · (555) 010-1234</div>
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      <div style={{ fontSize: 11 }}>
        Commande : {order.id.slice(-8).toUpperCase()}<br />
        {order.table_label && <>Table : {order.table_label}<br /></>}
        {dt.toLocaleString("fr-FR")}
      </div>
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      {order.items.map((it) => (
        <div key={it.id} style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{it.quantity}× {it.name}</span>
          <span>{formatCurrency(it.price * it.quantity)}</span>
        </div>
      ))}
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 14 }}>
        <span>TOTAL</span><span>{formatCurrency(order.total)}</span>
      </div>
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      <div style={{ textAlign: "center", fontSize: 11 }}>Merci ! ☕</div>
    </div>
  );
}
