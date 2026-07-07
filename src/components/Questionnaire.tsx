import { useEffect, useState } from "react";

import { type QuestionnaireMembre, getEventQuestionnaire, submitQuestionnaire } from "../api.js";
import { useT } from "../i18n.js";
import { T } from "../proto.js";

/** Inline post-session questionnaire for one event. Loads its availability and,
 * when open, lets the member answer once. */
export function Questionnaire({ token, eventId, flat = false }: { token: string; eventId: string; flat?: boolean }): JSX.Element | null {
  const t = useT();
  const [data, setData] = useState<QuestionnaireMembre | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void getEventQuestionnaire(token, eventId).then(setData).catch(() => undefined);
  }, [token, eventId]);

  if (!data) return null;
  if (done || data.deja_repondu) {
    return <p style={{ fontSize: 11.5, color: T.ok, margin: "4px 0 0" }}>{t("quest.thanks")}</p>;
  }
  if (!data.disponible) return null;

  async function submit(): Promise<void> {
    setBusy(true);
    try {
      await submitQuestionnaire(token, eventId, answers);
      setDone(true);
    } catch {
      // keep the form open on failure
    } finally {
      setBusy(false);
    }
  }

  // An evaluation is optional feedback: a member may leave only a rating, only a
  // comment, or both. At least one answer is enough to send.
  const peutEnvoyer = data.questions.some((q) => (answers[q.id] ?? "").trim() !== "");

  // Flattened when nested inside an activity card (no double frame): a top rule
  // and inset instead of its own bordered card.
  const box = flat
    ? { borderTop: `1px solid ${T.line}`, paddingTop: 12, marginTop: 4 }
    : { background: T.surf, border: `1px solid ${T.line}`, borderRadius: 12, padding: 12, marginTop: 4 };
  return (
    <div style={box}>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, margin: "0 0 6px", fontFamily: T.fd }}>{data.titre}</p>
      <p style={{ fontSize: 10.5, color: T.ok, background: T.okbg, border: `1px solid ${T.ok}`, borderRadius: 9, padding: "7px 9px", margin: "0 0 10px", lineHeight: 1.5 }}>
        {t("quest.anonA")}<strong>{t("quest.anonBold")}</strong>{t("quest.anonB")}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.questions.map((q) => (
          <label key={q.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11.5, color: T.mut }}>{q.libelle}</span>
            {q.type === "note" ? (
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: String(n) }))}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 9,
                      border: `1px solid ${answers[q.id] === String(n) ? T.b600 : T.line}`,
                      background: answers[q.id] === String(n) ? T.b600 : T.surf,
                      color: answers[q.id] === String(n) ? "#fff" : T.ink,
                      fontWeight: 600,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            ) : q.type === "choix" ? (
              <select
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                style={{ height: 40, border: `1px solid ${T.line}`, borderRadius: 9, padding: "0 10px", fontSize: 13 }}
              >
                <option value="">{t("quest.choose")}</option>
                {q.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                rows={2}
                style={{ border: `1px solid ${T.line}`, borderRadius: 9, padding: 8, fontSize: 13, resize: "vertical" }}
              />
            )}
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={busy || !peutEnvoyer}
        onClick={() => void submit()}
        className="tap"
        style={{ marginTop: 12, width: "100%", height: 42, background: `linear-gradient(180deg,${T.b500},${T.b600})`, borderRadius: 11, border: "none", color: "#fff", fontWeight: 600, fontSize: 13, opacity: busy || !peutEnvoyer ? 0.6 : 1 }}
      >
        {busy ? t("common.sending") : t("quest.submit")}
      </button>
    </div>
  );
}
