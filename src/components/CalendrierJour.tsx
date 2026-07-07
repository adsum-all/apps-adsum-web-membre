import { useState } from "react";

import { type AnniversaireOut, type EvenementOut } from "../api.js";
import { useT } from "../i18n.js";
import { civilName } from "../name.js";
import { formatTime } from "../format.js";
import { T } from "../proto.js";

function isFormation(e: EvenementOut): boolean {
  const kind = `${e.type ?? ""} ${e.volet}`.toLowerCase();
  return kind.includes("formation");
}

function modeLabelKey(mode: string | null | undefined): string {
  return mode === "en_ligne" ? "part.modEnLigne" : mode === "hybride" ? "caljour.modeHybride" : "caljour.modePresentiel";
}

function phaseLabelKey(phase: string): string {
  return phase === "en_cours" ? "act.enCours" : phase === "bientot" ? "act.phaseBientot" : phase === "termine" ? "act.phaseTermine" : "act.aVenir";
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
  const [ouvert, setOuvert] = useState<string | null>(null);

  if (events.length === 0 && anniversaires.length === 0) {
    return <p style={{ fontSize: 12.5, color: T.mut, padding: "14px 2px" }}>{t("calendar.empty")}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
      {events.map((e) => {
        const formation = isFormation(e);
        const color = formation ? T.warn : T.b600;
        const bg = formation ? T.warnbg : T.tintb;
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
            <div
              onClick={() => setOuvert((o) => (o === e.id ? null : e.id))}
              className="tap"
              style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 8 }}
            >
              <span>{e.titre}</span>
              <span style={{ color: T.faint, fontSize: 12 }}>{ouvert === e.id ? "▴" : "▾"}</span>
            </div>
            {e.lieu && <div style={{ fontSize: 11, color: T.mut, marginTop: 2 }}>{e.lieu}</div>}
            {(e.tags ?? []).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                {(e.tags ?? []).map((tg) => (
                  <span key={tg.id} style={{ fontSize: 9.5, fontWeight: 600, color: T.warn, background: T.warnbg, borderRadius: 7, padding: "2px 7px" }}>
                    {tg.libelle}
                  </span>
                ))}
              </div>
            )}
            {ouvert === e.id && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.line}`, display: "flex", flexDirection: "column", gap: 4 }}>
                <DetailRow label={t("caljour.horaires")} value={`${formatTime(e.debut)}${e.fin ? ` - ${formatTime(e.fin)}` : ""}`} />
                <DetailRow label={t("detail.mode")} value={t(modeLabelKey(e.mode))} />
                {e.lieu && <DetailRow label={t("caljour.lieu")} value={e.lieu} />}
                <DetailRow label={t("caljour.etat")} value={t(phaseLabelKey(e.phase))} />
                {e.cible_libelle && <DetailRow label={t("caljour.concerne")} value={e.cible_libelle} />}
              </div>
            )}
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
                  {civilName({ prenoms: a.prenoms })}
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

function DetailRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11.5 }}>
      <span style={{ color: T.mut }}>{label}</span>
      <span style={{ color: T.ink, fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}
