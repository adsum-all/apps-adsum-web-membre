import { type EvenementOut, getEvenements } from "../api.js";
import { formatDateTime } from "../format.js";
import { useResource } from "../useResource.js";
import { Participation } from "./Participation.js";
import { Questionnaire } from "./Questionnaire.js";

// Upcoming and ongoing events for the member, fetched live from the API.
export function Activites({
  token,
  onJoin,
}: {
  token: string;
  onJoin?: (evenement: EvenementOut) => void;
}): JSX.Element {
  const { data, loading, error } = useResource(() => getEvenements(token), [token]);

  if (loading) return <Centered text="Chargement des activites..." />;
  if (error) return <Centered text={error} />;
  if (!data || data.length === 0) {
    return <Centered text="Aucune activite a venir pour le moment." />;
  }

  return (
    <ul className="list">
      {data.map((e) => (
        <li key={e.id} className="list-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
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
          </div>
          {e.session_ouverte && (
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => onJoin?.(e)}
            >
              ▶ Rejoindre la session
            </button>
          )}
          <Participation token={token} eventId={e.id} />
          {isEnded(e) && <Questionnaire token={token} eventId={e.id} />}
        </li>
      ))}
    </ul>
  );
}

function isEnded(e: EvenementOut): boolean {
  return e.fin != null && new Date(e.fin).getTime() < Date.now();
}

function Centered({ text }: { text: string }): JSX.Element {
  return (
    <div className="empty">
      <div className="empty-glyph" aria-hidden="true">▤</div>
      <p>{text}</p>
    </div>
  );
}
