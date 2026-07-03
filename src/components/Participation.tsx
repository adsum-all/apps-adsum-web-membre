import { type ReactNode, useEffect, useState } from "react";

import { type ParticipationMembre, declarerParticipation, getParticipation } from "../api.js";
import { useT } from "../i18n.js";
import { T } from "../proto.js";

const OPTIONS: { value: "present" | "partiel" | "absent"; labelKey: string; hintKey: string }[] = [
  { value: "present", labelKey: "part.present", hintKey: "part.presentHint" },
  { value: "partiel", labelKey: "part.partiel", hintKey: "part.partielHint" },
  { value: "absent", labelKey: "part.absent", hintKey: "part.absentHint" },
];

/**
 * Participation for one activity. It can be confirmed only once: after
 * validation the whole form locks (read-only), so a member can never come back
 * to change their status, rating or opinion. A scanned member is already present
 * and only confirms their feedback.
 */
export function Participation({ token, eventId }: { token: string; eventId: string }): JSX.Element | null {
  const [data, setData] = useState<ParticipationMembre | null>(null);
  const [choix, setChoix] = useState<"present" | "partiel" | "absent" | null>(null);
  const [avis, setAvis] = useState("");
  const [note, setNote] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const t = useT();

  useEffect(() => {
    void getParticipation(token, eventId)
      .then((d) => {
        setData(d);
        setChoix(d.statut);
        setAvis(d.avis ?? "");
        setNote(d.note);
      })
      .catch(() => undefined);
  }, [token, eventId]);

  if (!data) return null;

  const locked = data.verrouille;
  const scanned = data.deja_scanne;

  // Before the activity starts (and if nothing recorded yet), the form is fully
  // hidden: no premature participation, no dead card on upcoming events.
  if (!data.ouvert && !scanned && !locked) {
    return null;
  }

  // Declaration window over and nothing recorded: the screen says so instead of
  // showing a form the server would reject (no misleading state, ever).
  if (data.cloture && !locked && !scanned && data.statut == null) {
    return (
      <Card>
        <Title text={t("part.title")} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.bg, border: `1px dashed ${T.line}`, borderRadius: 10, padding: "10px 12px" }}>
          <span style={{ color: T.mut, fontWeight: 700 }}>-</span>
          <span style={{ fontSize: 12.5, color: T.mut }}>{t("part.closed")}</span>
        </div>
      </Card>
    );
  }

  // Finalized: read-only summary, no inputs, no buttons.
  if (locked) {
    const statutLabel = data.statut ? t(`part.${data.statut}`) : "-";
    return (
      <Card>
        <Title text={t("part.recorded")} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.okbg, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
          <span style={{ color: T.ok, fontWeight: 700 }}>✓</span>
          <span style={{ fontSize: 12.5, color: T.ink }}>
            {t("part.yourStatus")} : <b>{statutLabel}</b>{data.note ? ` · ${data.note}/5` : ""}
          </span>
        </div>
        {data.avis && <p style={{ fontSize: 12, color: T.mut, margin: "0 0 6px", fontStyle: "italic" }}>&laquo; {data.avis} &raquo;</p>}
        <p style={{ fontSize: 11, color: T.faint, margin: 0 }}>{t("part.immutable")}</p>
      </Card>
    );
  }

  async function valider(): Promise<void> {
    setBusy(true);
    setMsg(null);
    try {
      const body: { statut?: string; avis?: string; note?: number; valider: boolean } = { valider: true };
      if (choix) body.statut = choix;
      if (avis.trim()) body.avis = avis.trim();
      if (note) body.note = note;
      await declarerParticipation(token, eventId, body);
      const fresh = await getParticipation(token, eventId);
      setData(fresh);
    } catch (e) {
      // Never fail silently: the member must know why nothing happened
      // (window closed, already recorded, network...).
      setMsg(e instanceof Error && e.message ? e.message : t("part.error"));
      try {
        const fresh = await getParticipation(token, eventId);
        setData(fresh);
      } catch {
        // keep the current view if the refresh itself fails
      }
    } finally {
      setBusy(false);
    }
  }

  const showFeedback = scanned || choix === "present" || choix === "partiel";
  const canConfirm = scanned || choix != null;

  return (
    <Card>
      <Title text={t("part.title")} />

      {scanned ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.okbg, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
          <span style={{ color: T.ok, fontWeight: 700 }}>✓</span>
          <span style={{ fontSize: 12.5, color: T.ink }}>{t("part.scanned")}</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
          {OPTIONS.map((o) => (
            <div
              key={o.value}
              onClick={() => setChoix(o.value)}
              className="tap"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 13px",
                borderRadius: 11,
                border: `1.5px solid ${choix === o.value ? T.b600 : T.line}`,
                background: choix === o.value ? T.b600 : "#fff",
                color: choix === o.value ? "#fff" : T.ink,
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t(o.labelKey)}</div>
                <div style={{ fontSize: 10.5, color: choix === o.value ? "rgba(255,255,255,.85)" : T.mut }}>{t(o.hintKey)}</div>
              </div>
              <span style={{ fontSize: 15 }}>{choix === o.value ? "●" : "○"}</span>
            </div>
          ))}
        </div>
      )}

      {showFeedback && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 11, color: T.mut, marginBottom: 4 }}>{t("part.yourRating")}</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNote(n)}
                style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${note === n ? T.b600 : T.line}`, background: note === n ? T.b600 : "#fff", color: note === n ? "#fff" : T.ink, fontWeight: 600 }}
              >
                {n}
              </button>
            ))}
          </div>
          <textarea
            value={avis}
            onChange={(e) => setAvis(e.target.value)}
            rows={2}
            placeholder={t("part.opinion")}
            style={{ width: "100%", border: `1px solid ${T.line}`, borderRadius: 9, padding: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
          />
        </div>
      )}

      {msg && <p style={{ fontSize: 11.5, color: T.dng, margin: "8px 0 0" }}>{msg}</p>}
      <p style={{ fontSize: 10.5, color: T.faint, margin: "8px 0 6px" }}>
        {t("part.confirmOnce")}
        {data.cloture_le
          ? ` ${t("part.openUntil").replace("{d}", new Date(data.cloture_le).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }))}`
          : ""}
      </p>

      <button
        type="button"
        disabled={busy || !canConfirm}
        onClick={() => void valider()}
        className="tap"
        style={{ width: "100%", height: 44, borderRadius: 11, border: "none", background: `linear-gradient(180deg,${T.b500},${T.b600})`, color: "#fff", fontWeight: 600, fontSize: 13.5, opacity: busy || !canConfirm ? 0.6 : 1 }}
      >
        {busy ? t("part.sending") : scanned ? t("part.validateOpinion") : t("part.validate")}
      </button>
    </Card>
  );
}

function Card({ children }: { children: ReactNode }): JSX.Element {
  return <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 12, padding: 12, marginTop: 6 }}>{children}</div>;
}

function Title({ text }: { text: string }): JSX.Element {
  return <p style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, margin: "0 0 8px", fontFamily: T.fd }}>{text}</p>;
}
