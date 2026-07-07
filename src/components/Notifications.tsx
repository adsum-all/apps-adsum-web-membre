import { useState } from "react";

import { getNotifications, markNotificationsRead, marquerNotificationLue } from "../api.js";
import { formatDateTime } from "../format.js";
import { useT } from "../i18n.js";
import { useResource } from "../useResource.js";

function targetOf(titre: string | null, type: string | null): "document" | "recensement" | null {
  const t = `${titre ?? ""} ${type ?? ""}`.toLowerCase();
  if (t.includes("document") || t.includes("justificatif") || t.includes("piece")) return "document";
  if (t.includes("recensement")) return "recensement";
  return null;
}

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** Group key (YYYY-MM) and human label for one notification date. */
function moisDe(iso: string | null): { cle: string; libelle: string } {
  if (!iso) return { cle: "0000-00", libelle: "Sans date" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { cle: "0000-00", libelle: "Sans date" };
  const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return { cle, libelle: `${MOIS[d.getMonth()]} ${d.getFullYear()}` };
}

export function Notifications({
  token,
  onDocument,
  onRecensement,
}: {
  token: string;
  onDocument?: () => void;
  onRecensement?: () => void;
}): JSX.Element {
  const t = useT();
  const { data, loading, error } = useResource(() => getNotifications(token), [token]);
  // Locally-known read ids so the UI reacts instantly; the server state is
  // persisted by the per-notification endpoint (idempotent).
  const [luesLocal, setLuesLocal] = useState<Set<string>>(new Set());
  const [toutLu, setToutLu] = useState(false);

  if (loading) return <div className="empty"><p>{t("notif.loading")}</p></div>;
  if (error) return <div className="empty"><p>{error}</p></div>;
  if (!data || data.length === 0) {
    return (
      <div className="empty">
        <div className="empty-glyph" aria-hidden="true">○</div>
        <p>{t("notif.empty")}</p>
      </div>
    );
  }

  const estLue = (id: string, lu: boolean): boolean => toutLu || lu || luesLocal.has(id);
  const nonLues = data.filter((n) => !estLue(n.id, n.lu)).length;

  function lire(id: string, dejaLue: boolean): void {
    if (!dejaLue) {
      setLuesLocal((prev) => new Set(prev).add(id));
      void marquerNotificationLue(token, id).catch(() => undefined);
    }
  }

  // Chronological grouping: newest months first, current month open, older
  // months collapsed so long histories stay readable.
  const groupes: { cle: string; libelle: string; items: typeof data }[] = [];
  for (const n of data) {
    const { cle, libelle } = moisDe(n.cree_le);
    let g = groupes.find((x) => x.cle === cle);
    if (!g) {
      g = { cle, libelle, items: [] };
      groupes.push(g);
    }
    g.items.push(n);
  }
  const maintenant = moisDe(new Date().toISOString()).cle;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 2px 10px" }}>
        <span className="list-sub">{nonLues > 0 ? t("notif.unreadCount").replace("{n}", String(nonLues)) : t("notif.allRead")}</span>
        <button
          type="button"
          className="login-link"
          disabled={nonLues === 0}
          style={{ opacity: nonLues > 0 ? 1 : 0.5 }}
          onClick={() => {
            setToutLu(true);
            void markNotificationsRead(token);
          }}
        >
          {t("notif.markAllRead")}
        </button>
      </div>
      {groupes.map((g) => (
        <details key={g.cle} open={g.cle === maintenant} style={{ marginBottom: 8 }}>
          <summary
            style={{ cursor: "pointer", padding: "6px 2px", fontSize: 12, fontWeight: 700, color: "var(--mut, #6b7280)", textTransform: "capitalize" }}
          >
            {g.libelle} · {g.items.length}
            {g.items.some((n) => !estLue(n.id, n.lu)) ? t("notif.groupUnread") : ""}
          </summary>
          <ul className="list">
            {g.items.map((n) => {
              const target = targetOf(n.titre, n.type);
              const navigation = target === "document" ? onDocument : target === "recensement" ? onRecensement : undefined;
              const lue = estLue(n.id, n.lu);
              return (
                <li
                  key={n.id}
                  className={`list-item notif ${lue ? "" : "notif-unread"} row-tap`}
                  onClick={() => {
                    lire(n.id, lue);
                    navigation?.();
                  }}
                >
                  <div className="list-main">
                    <strong>{n.titre ?? t("notif.fallbackTitle")}</strong>
                    <span className="list-sub">{n.corps ?? ""}</span>
                    <span className="list-sub faint">{formatDateTime(n.cree_le)}</span>
                  </div>
                  {!lue && <span className="dot" aria-label={t("notif.unreadAria")} />}
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </>
  );
}
