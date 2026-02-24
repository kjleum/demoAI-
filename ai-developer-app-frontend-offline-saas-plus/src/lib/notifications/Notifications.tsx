import { useNotifications } from "./notifications.store";

export function Notifications() {
  const items = useNotifications((s) => s.items);
  return (
    <div style={{ position:"fixed", right:12, top:12, zIndex: 9999, display:"flex", flexDirection:"column", gap:8, width:"min(360px, 92vw)" }}>
      {items.map((n) => (
        <div key={n.id} style={{
          background:"var(--panel)", border:"1px solid var(--border)", borderRadius:14, padding:"10px 12px", boxShadow:"var(--shadow)"
        }}>
          <div style={{display:"flex", justifyContent:"space-between", gap:8}}>
            <b>{n.title}</b>
            <span style={{opacity:.6, fontSize:12}}>{new Date(n.ts).toLocaleTimeString()}</span>
          </div>
          {n.detail && <div style={{marginTop:4, color:"var(--muted)"}}>{n.detail}</div>}
        </div>
      ))}
    </div>
  );
}
