import { getEvenements } from "../api.js";
import { formatDateTime } from "../format.js";
import { useResource } from "../useResource.js";

// Upcoming and ongoing events for the member, fetched live from the API.
export function Activites({ token }: { token: string }): JSX.Element {
  const { data, loading, error } = useResource(() => getEvenements(token), [token]);

  if (loading) return <Centered text="Chargement des activites..." />;
  if (error) return <Centered text={error} />;
  if (!data || data.length === 0) {
    return <Centered text="Aucune activite a venir pour le moment." />;
  }

  return (
    <ul className="list">
      {data.map((e) => (
        <li key={e.id} className="list-item">
          <div className="list-main">
            <strong>{e.titre}</strong>
            <span className="list-sub">{formatDateTime(e.debut)}</span>
          </div>
          <div className="list-meta">
            {e.lieu && <span className="list-place">{e.lieu}</span>}
            <span className={`badge ${e.session_ouverte ? "badge-ok" : "badge-mut"}`}>
              {e.session_ouverte ? "Session ouverte" : `Volet ${e.volet}`}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Centered({ text }: { text: string }): JSX.Element {
  return (
    <div className="empty">
      <div className="empty-glyph" aria-hidden="true">▤</div>
      <p>{text}</p>
    </div>
  );
}
