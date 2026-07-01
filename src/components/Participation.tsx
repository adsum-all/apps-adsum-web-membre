import { useEffect, useState } from "react";

import { type ParticipationMembre, declarerParticipation, getParticipation } from "../api.js";
import { T } from "../proto.js";

const OPTIONS: { value: "present" | "partiel" | "absent"; label: string; hint: string }[] = [
  { value: "present", label: "Présent", hint: "J'ai suivi l'activité" },
  { value: "partiel", label: "Suivi partiel", hint: "J'ai suivi une partie" },
  { value: "absent", label: "Absent", hint: "Je n'ai pas participé" },
];

/**
 * Participation for one activity. A scanned member is already counted present and
 * can only leave feedback; an online member declares present/partial/absent and
 * validates (editable until then).
 */
export function Participation({ token, eventId }: { token: string; eventId: string }): JSX.Element | null {
  const [data, setData] = useState<ParticipationMembre | null>(null);
  const [choix, setChoix] = useState<"present" | "partiel" | "absent" | null>(null);
  const [avis, setAvis] = useState("");
  const [note, setNote] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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

  async function envoyer(valider: boolean): Promise<void> {
    setBusy(true);
    setMsg(null);
    try {
      const body: { statut?: string; avis?: string; note?: number; valider?: boolean } = { valider };
      if (choix) body.statut = choix;
      if (avis.trim()) body.avis = avis.trim();
      if (note) body.note = note;
      const r = await declarerParticipation(token, eventId, body);
      const fresh = await getParticipation(token, eventId);
      setData(fresh);
      setMsg(valider ? (r.message ?? "Réponse validée.") : "Réponse enregistrée (modifiable).");
    } finally {
      setBusy(false);
    }
  }

  const locked = data.verrouille;
  const scanned = data.deja_scanne;

  return (
    <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 12, padding: 12, marginTop: 6 }}>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, margin: "0 0 8px", fontFamily: T.fd }}>Ma participation</p>

      {scanned ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.okbg, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
          <span style={{ color: T.ok, fontWeight: 700 }}>✓</span>
          <span style={{ fontSize: 12.5, color: T.ink }}>Vous êtes marqué(e) présent(e) (scan confirmé). Vous pouvez laisser votre avis.</span>
        </div>
      ) : locked ? (
        <div style={{ background: T.okbg, borderRadius: 10, padding: "10px 12px", marginBottom: 10, fontSize: 12.5, color: T.ink }}>
          Réponse validée : <b>{labelOf(data.statut)}</b>. Elle ne peut plus être modifiée.
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
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{o.label}</div>
                <div style={{ fontSize: 10.5, color: choix === o.value ? "rgba(255,255,255,.85)" : T.mut }}>{o.hint}</div>
              </div>
              <span style={{ fontSize: 15 }}>{choix === o.value ? "●" : "○"}</span>
            </div>
          ))}
        </div>
      )}

      {/* Feedback: available to everyone with a participation context (scanned or declared present/partial). */}
      {(scanned || choix === "present" || choix === "partiel" || (locked && data.statut !== "absent")) && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 11, color: T.mut, marginBottom: 4 }}>Votre note</div>
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
            placeholder="Votre avis (facultatif)"
            style={{ width: "100%", border: `1px solid ${T.line}`, borderRadius: 9, padding: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
          />
        </div>
      )}

      {msg && <p style={{ fontSize: 11.5, color: T.ok, margin: "8px 0 0" }}>{msg}</p>}

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {!locked && (
          <button type="button" disabled={busy || !choix} onClick={() => void envoyer(false)} className="tap" style={{ flex: 1, height: 42, borderRadius: 11, border: `1px solid ${T.b600}`, background: "#fff", color: T.b600, fontWeight: 600, fontSize: 13, opacity: busy || !choix ? 0.6 : 1 }}>
            Enregistrer
          </button>
        )}
        <button type="button" disabled={busy || (!locked && !choix)} onClick={() => void envoyer(!locked)} className="tap" style={{ flex: 1, height: 42, borderRadius: 11, border: "none", background: `linear-gradient(180deg,${T.b500},${T.b600})`, color: "#fff", fontWeight: 600, fontSize: 13, opacity: busy ? 0.6 : 1 }}>
          {locked ? "Enregistrer mon avis" : "Valider ma réponse"}
        </button>
      </div>
    </div>
  );
}

function labelOf(statut: string | null): string {
  return OPTIONS.find((o) => o.value === statut)?.label ?? "-";
}
