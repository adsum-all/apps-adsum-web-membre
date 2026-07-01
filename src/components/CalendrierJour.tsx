import { type AnniversaireOut, type EvenementOut } from "../api.js";
import { useT } from "../i18n.js";
import { displayName } from "../name.js";
import { formatTime } from "../format.js";
import { T } from "../proto.js";

function isFormation(e: EvenementOut): boolean {
  const kind = `${e.type ?? ""} ${e.volet}`.toLowerCase();
  return kind.includes("formation");
}

/** The agenda list for the selected day: events first (primary), then a subtle
 * birthdays block. Kept as a separate component so Calendrier stays small. */
export function CalendrierJour({
  events,
  anniversaires,
  onJoin,
}: {
  events: EvenementOut[];
  anniversaires: AnniversaireOut[];
  onJoin?: (evenement: EvenementOut) => void;
}): JSX.Element {
  const t = useT();

  if (events.length === 0 && anniversaires.length === 0) {
    return <p style={{ fontSize: 12.5, color: T.mut, padding: "14px 2px" }}>{t("calendar.empty")}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
      {events.map((e) => {
        const formation = isFormation(e);
        const color = formation ? T.warn : T.b600;
        const bg = formation ? T.warnbg : "#eaeefb";
        return (
          <div
            key={e.id}
            style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 13, padding: "11px 13px", borderLeft: `3px solid ${color}` }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color, background: bg, padding: "2px 7px", borderRadius: 8 }}>
                {formation ? t("calendar.formation") : t("calendar.activity")}
              </span>
              {formatTime(e.debut) && <span style={{ fontFamily: T.fm, fontSize: 10, color: T.mut }}>{formatTime(e.debut)}</span>}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{e.titre}</div>
            {e.lieu && <div style={{ fontSize: 11, color: T.mut, marginTop: 2 }}>{e.lieu}</div>}
            {e.session_ouverte && (
              <button
                type="button"
                className="btn btn-primary btn-block"
                style={{ marginTop: 9 }}
                onClick={() => {
                  if (e.lien_session) window.open(e.lien_session, "_blank", "noopener");
                  onJoin?.(e);
                }}
              >
                {t("calendar.join")}
              </button>
            )}
          </div>
        );
      })}

      {anniversaires.length > 0 && (
        <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 13, padding: "11px 13px" }}>
          <div style={{ fontFamily: T.fm, fontSize: 9, letterSpacing: 0.6, color: T.mut, marginBottom: 7 }}>
            {t("calendar.birthdays").toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {anniversaires.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }} aria-hidden="true">🎂</span>
                <span style={{ fontSize: 12.5, color: T.ink }}>
                  {displayName({ titre: a.titre, prenoms: a.prenoms })}
                  {a.est_vip && <span style={{ color: T.warn, marginLeft: 6, fontSize: 10 }}>★</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
