import { type PresenceOut } from "../api.js";
import { T } from "../proto.js";

function time(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function dateLong(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function duration(arrivee: string | null, depart: string | null): string {
  if (!arrivee || !depart) return "-";
  const a = new Date(arrivee).getTime();
  const b = new Date(depart).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return "-";
  const min = Math.round((b - a) / 60000);
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }): JSX.Element {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: last ? "none" : `1px solid ${T.line}` }}>
      <span style={{ fontSize: 12, color: T.mut }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export function DetailPresence({ presence }: { presence: PresenceOut }): JSX.Element {
  const enLigne = presence.methode === "en_ligne" || presence.methode === "lien";
  return (
    <div className="scr" style={{ padding: "6px 18px 14px" }}>
      <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, fontFamily: T.fd }}>{presence.evenement_titre}</div>
        <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
          <span style={{ fontFamily: T.fm, fontSize: 9, background: T.okbg, color: T.ok, padding: "4px 9px", borderRadius: 20 }}>
            PRÉSENT · {enLigne ? "EN LIGNE" : "SALLE"}
          </span>
        </div>
      </div>
      <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 16, marginTop: 12, padding: "4px 16px" }}>
        <Row label="Date" value={dateLong(presence.arrivee ?? presence.debut)} />
        <Row label="Arrivée" value={time(presence.arrivee)} />
        <Row label="Départ" value={time(presence.depart)} />
        <Row label="Durée" value={duration(presence.arrivee, presence.depart)} />
        <Row label="Mode" value={enLigne ? "En ligne" : "En salle"} last />
      </div>
      <div style={{ textAlign: "center", fontFamily: T.fm, fontSize: 8.5, color: T.faint, marginTop: 14 }}>
        Donnée en lecture seule · tracée à l'audit
      </div>
    </div>
  );
}
