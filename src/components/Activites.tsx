import { useMemo, useState } from "react";

import { type EvenementOut, getEvenements } from "../api.js";
import { formatDateTime } from "../format.js";
import { useT } from "../i18n.js";
import { T } from "../proto.js";
import { useResource } from "../useResource.js";
import { Participation } from "./Participation.js";
import { Questionnaire } from "./Questionnaire.js";

type Cat = "enCours" | "aVenir" | "passees";

const PAGE = 5; // events shown per section before "show more"

// Grouping follows the server-computed lifecycle phase, never a manual flag.
function categorize(e: EvenementOut): Cat {
  if (e.phase === "en_cours") return "enCours";
  if (e.phase === "termine") return "passees";
  return "aVenir"; // a_venir or bientot
}

// Upcoming, ongoing and past events for the member, grouped and paginated so the
// screen stays short and phone-sized whatever the number of activities.
export function Activites({
  token,
  onJoin,
}: {
  token: string;
  onJoin?: (evenement: EvenementOut) => void;
}): JSX.Element {
  const t = useT();
  const { data, loading, error } = useResource(() => getEvenements(token), [token]);

  const groups = useMemo(() => {
    const g: Record<Cat, EvenementOut[]> = { enCours: [], aVenir: [], passees: [] };
    for (const e of data ?? []) g[categorize(e)].push(e);
    g.enCours.sort((a, b) => +new Date(a.debut) - +new Date(b.debut));
    g.aVenir.sort((a, b) => +new Date(a.debut) - +new Date(b.debut));
    g.passees.sort((a, b) => +new Date(b.debut) - +new Date(a.debut));
    return g;
  }, [data]);

  if (loading) return <Centered text={t("act.loading")} />;
  if (error) return <Centered text={error} />;
  if (!data || data.length === 0) return <Centered text={t("act.empty")} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Section title={t("act.enCours")} events={groups.enCours} token={token} onJoin={onJoin} accent={T.ok} />
      <Section title={t("act.aVenir")} events={groups.aVenir} token={token} onJoin={onJoin} accent={T.b600} />
      <Section title={t("act.passees")} events={groups.passees} token={token} onJoin={onJoin} accent={T.faint} />
    </div>
  );
}

function Section({
  title,
  events,
  token,
  onJoin,
  accent,
}: {
  title: string;
  events: EvenementOut[];
  token: string;
  onJoin?: (evenement: EvenementOut) => void;
  accent: string;
}): JSX.Element | null {
  const t = useT();
  const [limit, setLimit] = useState(PAGE);
  if (events.length === 0) return null;
  const shown = events.slice(0, limit);
  const rest = events.length - limit;

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 2px 6px" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: accent }} />
        <h3 style={{ fontSize: 12, fontWeight: 700, color: T.ink, letterSpacing: 0.3, textTransform: "uppercase", margin: 0, fontFamily: T.fd }}>{title}</h3>
        <span style={{ fontSize: 11, color: T.faint }}>({events.length})</span>
      </div>
      <ul className="list" style={{ margin: 0 }}>
        {shown.map((e) => (
          <li key={e.id} className="list-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div className="list-main">
                <strong>{e.titre}</strong>
                <span className="list-sub">{formatDateTime(e.debut)}</span>
              </div>
              <div className="list-meta">
                {e.mode && (
                  <span className="list-place">
                    {e.mode === "en_ligne" ? "En ligne" : e.mode === "hybride" ? "Hybride" : "Présentiel"}
                  </span>
                )}
                {e.lieu && <span className="list-place">{e.lieu}</span>}
                {e.cible_type && e.cible_type !== "general" && e.cible_libelle && (
                  <span className="list-place" style={{ color: T.warn }}>Réservé : {e.cible_libelle}</span>
                )}
                <PhaseBadge phase={e.phase} volet={e.volet} />
              </div>
            </div>
            {/* The join button appears only when the session is truly joinable
                (in the time window and a link is available), never just because
                a link was stored or a flag was toggled. */}
            {e.joignable && (
              <button type="button" className="btn btn-primary btn-block" onClick={() => onJoin?.(e)}>
                {t("part.joinSession")}
              </button>
            )}
            {e.formulaire_ouvert && <Participation token={token} eventId={e.id} />}
            {e.formulaire_ouvert && <Questionnaire token={token} eventId={e.id} />}
          </li>
        ))}
      </ul>
      {rest > 0 && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE)}
          style={{ width: "100%", marginTop: 8, background: "none", border: `1px solid ${T.line}`, borderRadius: 10, padding: "9px 12px", color: T.mut, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          {t("act.voirPlus")} ({rest})
        </button>
      )}
    </section>
  );
}

function PhaseBadge({ phase, volet }: { phase: EvenementOut["phase"]; volet: string }): JSX.Element {
  const t = useT();
  if (phase === "en_cours") return <span className="badge badge-ok">{t("act.phaseEnCours")}</span>;
  if (phase === "bientot") return <span className="badge" style={{ background: "#f6efdc", color: "#8a6d1f" }}>{t("act.phaseBientot")}</span>;
  if (phase === "termine") return <span className="badge badge-mut">{t("act.phaseTermine")}</span>;
  return <span className="badge badge-mut">{t("act.phaseAVenir")} · {volet}</span>;
}

function Centered({ text }: { text: string }): JSX.Element {
  return (
    <div className="empty">
      <div className="empty-glyph" aria-hidden="true">▤</div>
      <p>{text}</p>
    </div>
  );
}
