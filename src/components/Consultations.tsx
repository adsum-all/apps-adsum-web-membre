import { useCallback, useEffect, useState } from "react";

import {
  ApiError,
  type ConsultationDetail,
  type MembreConsultation,
  getConsultationDetail,
  getMesConsultations,
  repondreConsultation,
} from "../api.js";
import { useT } from "../i18n.js";
import { T } from "../proto.js";

/** Member-facing consultations: answer a survey addressed to your perimeter.
 * One answer per question (the server enforces it); re-answering updates it. */
export function Consultations({ token }: { token: string }): JSX.Element {
  const t = useT();
  const [liste, setListe] = useState<MembreConsultation[] | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    getMesConsultations(token)
      .then(setListe)
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : t("consult.unavailableList")));
  }, [token]);
  useEffect(() => reload(), [reload]);

  if (selection) {
    return <Repondre token={token} id={selection} onBack={() => { setSelection(null); reload(); }} />;
  }

  return (
    <div style={{ padding: "8px 2px 16px" }}>
      {error && liste === null ? (
        <div style={{ textAlign: "center", padding: "36px 12px" }}>
          <p style={banner}>{error}</p>
          <button type="button" className="btn btn-ghost" onClick={() => { setError(null); reload(); }} style={{ marginTop: 12 }}>{t("common.retry")}</button>
        </div>
      ) : liste === null ? (
        <p style={{ color: T.mut, fontSize: 13 }}>{t("common.loading")}</p>
      ) : liste.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 12px", color: T.mut }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🗳</div>
          <p style={{ fontSize: 13 }}>{t("consult.empty")}</p>
        </div>
      ) : (
        liste.map((c) => (
          <div key={c.id} onClick={() => setSelection(c.id)} className="tap" style={card}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{c.titre}</div>
            {c.description && <div style={{ fontSize: 12, color: T.mut, marginTop: 3 }}>{c.description}</div>}
            <div style={{ fontSize: 11, color: T.b600, marginTop: 6, fontWeight: 600 }}>{t("consult.answer")}</div>
          </div>
        ))
      )}
    </div>
  );
}

function Repondre({ token, id, onBack }: { token: string; id: string; onBack: () => void }): JSX.Element {
  const t = useT();
  const [detail, setDetail] = useState<ConsultationDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getConsultationDetail(token, id)
      .then(setDetail)
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : t("consult.unavailableDetail")));
  }, [token, id]);

  const set = (qid: string, v: string) => setAnswers((a) => ({ ...a, [qid]: v }));

  const submit = useCallback(() => {
    if (!detail) return;
    setBusy(true);
    setError(null);
    const reponses = detail.questions
      .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
      .map((q) => ({ question_id: q.id, valeur: String(answers[q.id] ?? "") }));
    repondreConsultation(token, id, reponses)
      .then(() => setDone(true))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : t("consult.sendError")))
      .finally(() => setBusy(false));
  }, [detail, answers, token, id]);

  if (!detail) {
    return (
      <div style={{ padding: 16 }}>
        {error ? <p style={banner}>{error}</p> : <p style={{ color: T.mut }}>{t("common.loading")}</p>}
        <button type="button" className="btn btn-ghost btn-block" onClick={onBack} style={{ marginTop: 12 }}>{t("common.back")}</button>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ padding: "40px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
        <p style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{t("consult.thanks")}</p>
        <button type="button" className="btn btn-block" onClick={onBack} style={{ marginTop: 16 }}>{t("consult.finish")}</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 4px 16px" }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: T.ink, margin: "4px 0 4px" }}>{detail.titre}</h2>
      {detail.description && <p style={{ fontSize: 13, color: T.mut, marginTop: 0 }}>{detail.description}</p>}
      {error && <p style={banner}>{error}</p>}
      {detail.questions.map((q) => (
        <div key={q.id} style={{ ...card, cursor: "default" }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, marginBottom: 8 }}>{q.libelle}</div>
          {q.type === "oui_non" ? (
            <div style={{ display: "flex", gap: 8 }}>
              {([["oui", t("common.yes")], ["non", t("common.no")]] as [string, string][]).map(([v, label]) => (
                <button key={v} type="button" onClick={() => set(q.id, v)} style={choice(answers[q.id] === v)}>{label}</button>
              ))}
            </div>
          ) : q.type === "choix" && q.options.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {q.options.map((o) => (
                <button key={o} type="button" onClick={() => set(q.id, o)} style={choice(answers[q.id] === o)}>{o}</button>
              ))}
            </div>
          ) : q.type === "note" ? (
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => set(q.id, String(n))} style={choice(answers[q.id] === String(n))}>{n}</button>
              ))}
            </div>
          ) : (
            <input style={inputStyle} placeholder={t("consult.answerPlaceholder")} value={answers[q.id] ?? ""} onChange={(e) => set(q.id, e.target.value)} />
          )}
        </div>
      ))}
      <button type="button" className="btn btn-block" onClick={submit} disabled={busy} style={{ marginTop: 8 }}>
        {busy ? t("common.sending") : t("consult.submit")}
      </button>
      <button type="button" className="btn btn-ghost btn-block" onClick={onBack} style={{ marginTop: 8 }}>{t("common.back")}</button>
    </div>
  );
}

const card: React.CSSProperties = {
  background: T.surf,
  border: `1px solid ${T.line}`,
  borderRadius: 14,
  padding: "12px 13px",
  marginBottom: 9,
};

const banner: React.CSSProperties = {
  background: T.tintr,
  border: `1px solid ${T.tintrl}`,
  borderRadius: 11,
  padding: 10,
  fontSize: 12.5,
  color: T.tintrf,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 11px",
  borderRadius: 10,
  border: `1px solid ${T.line}`,
  fontSize: 13,
};

function choice(active: boolean): React.CSSProperties {
  return {
    padding: "8px 14px",
    borderRadius: 10,
    border: `1px solid ${active ? T.b600 : T.line}`,
    background: active ? T.tintb : T.surf,
    color: active ? T.b600 : T.ink,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  };
}
