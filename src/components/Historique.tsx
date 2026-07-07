import { type PresenceOut, getHistorique } from "../api.js";
import { formatDateTime } from "../format.js";
import { useT } from "../i18n.js";
import { useResource } from "../useResource.js";
import { EmptyState } from "./ui.js";

// The member attendance history, read-only and traced to the audit, fetched live.
export function Historique({
  token,
  onSelect,
}: {
  token: string;
  onSelect?: (presence: PresenceOut) => void;
}): JSX.Element {
  const t = useT();
  const { data, loading, error } = useResource(() => getHistorique(token), [token]);

  if (loading) return <EmptyState variant="loading" text={t("hist.loading")} />;
  if (error) return <EmptyState variant="error" title={t("act.errorTitle")} text={error} />;
  if (!data || data.length === 0) {
    return <EmptyState variant="empty" title={t("hist.emptyTitle")} text={t("hist.emptyText")} />;
  }

  return (
    <ul className="list">
      {data.map((p) => (
        <li
          key={p.evenement_id}
          className={`list-item ${onSelect ? "row-tap" : ""}`}
          onClick={onSelect ? () => onSelect(p) : undefined}
        >
          <div className="list-main">
            <strong>{p.evenement_titre}</strong>
            <span className="list-sub">{formatDateTime(p.arrivee ?? p.debut)}</span>
          </div>
          <div className="list-meta">
            {p.methode && <span className="list-place">{t("hist.via").replace("{m}", p.methode.toUpperCase())}</span>}
            <span className="badge badge-ok">{t("part.present")}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
