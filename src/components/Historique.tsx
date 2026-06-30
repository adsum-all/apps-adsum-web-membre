import { type PresenceOut, getHistorique } from "../api.js";
import { formatDateTime } from "../format.js";
import { useResource } from "../useResource.js";

// The member attendance history, read-only and traced to the audit, fetched live.
export function Historique({
  token,
  onSelect,
}: {
  token: string;
  onSelect?: (presence: PresenceOut) => void;
}): JSX.Element {
  const { data, loading, error } = useResource(() => getHistorique(token), [token]);

  if (loading) return <Centered text="Chargement de l'historique..." />;
  if (error) return <Centered text={error} />;
  if (!data || data.length === 0) {
    return <Centered text="Aucune presence enregistree pour le moment." />;
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
            {p.methode && <span className="list-place">via {p.methode.toUpperCase()}</span>}
            <span className="badge badge-ok">Present</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Centered({ text }: { text: string }): JSX.Element {
  return (
    <div className="empty">
      <div className="empty-glyph" aria-hidden="true">↻</div>
      <p>{text}</p>
    </div>
  );
}
