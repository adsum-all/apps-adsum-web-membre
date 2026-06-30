import { useEffect, useState } from "react";

import { type DemandeDetail, type DemandeMessage, createDemande, getDemande, getDemandes, sendDemandeMessage } from "../api.js";
import { T, gradient } from "../proto.js";
import { useResource } from "../useResource.js";

const TYPES = [
  { value: "modification_info", label: "Modifier une information" },
  { value: "question", label: "Poser une question" },
  { value: "reclamation", label: "Réclamation" },
  { value: "autre", label: "Autre" },
];

interface Badge {
  label: string;
  bg: string;
  fg: string;
}
const DEFAULT_BADGE: Badge = { label: "Ouverte", bg: T.warnbg, fg: T.warn };
const STATUT_BADGE: Record<string, Badge> = {
  ouverte: DEFAULT_BADGE,
  en_cours: { label: "En cours", bg: "#eef3fc", fg: T.b600 },
  resolue: { label: "Résolue", bg: T.okbg, fg: T.ok },
  refusee: { label: "Refusée", bg: "#fae9e7", fg: T.dng },
};

function badgeFor(statut: string): Badge {
  return STATUT_BADGE[statut] ?? DEFAULT_BADGE;
}

function fmt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function Demandes({ token }: { token: string }): JSX.Element {
  const [mode, setMode] = useState<"list" | "new" | "thread">("list");
  const [openId, setOpenId] = useState<string | null>(null);

  if (mode === "new") return <NewDemande token={token} onDone={() => setMode("list")} onCancel={() => setMode("list")} />;
  if (mode === "thread" && openId)
    return <Thread token={token} id={openId} onBack={() => setMode("list")} />;
  return (
    <List
      token={token}
      onNew={() => setMode("new")}
      onOpen={(id) => {
        setOpenId(id);
        setMode("thread");
      }}
    />
  );
}

function List({ token, onNew, onOpen }: { token: string; onNew: () => void; onOpen: (id: string) => void }): JSX.Element {
  const { data, loading, error } = useResource(() => getDemandes(token), [token]);
  const list = data ?? [];

  return (
    <div className="scr" style={{ padding: "8px 18px 14px" }}>
      <div onClick={onNew} className="tap" style={{ height: 48, background: gradient, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14, marginBottom: 14, boxShadow: "0 10px 22px -10px rgba(42,79,173,.7)" }}>
        + Nouvelle demande
      </div>
      {loading && <p style={{ color: T.mut, fontSize: 13 }}>Chargement...</p>}
      {error && <p style={{ background: T.warnbg, border: `1px solid ${T.warn}`, borderRadius: 12, padding: 12, fontSize: 12, color: T.ink }}>{error}</p>}
      {!loading && list.length === 0 && !error && (
        <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 14, padding: 20, textAlign: "center", color: T.mut, fontSize: 13 }}>
          Aucune demande pour le moment. Contactez l'administration via une nouvelle demande.
        </div>
      )}
      {list.map((d) => {
        const s = badgeFor(d.statut);
        return (
          <div key={d.id} onClick={() => onOpen(d.id)} className="tap" style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 14, padding: 13, marginBottom: 9, display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{d.sujet}</div>
              <div style={{ fontSize: 10.5, color: T.mut }}>{d.nb_messages} message(s) · {fmt(d.cree_le)}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "4px 9px", borderRadius: 20, background: s.bg, color: s.fg }}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function NewDemande({ token, onDone, onCancel }: { token: string; onDone: () => void; onCancel: () => void }): JSX.Element {
  const [type, setType] = useState("modification_info");
  const [sujet, setSujet] = useState("");
  const [champ, setChamp] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    if (!sujet.trim() || !message.trim()) {
      setError("Sujet et message requis.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createDemande(token, { type, sujet: sujet.trim(), champ_concerne: champ.trim() || undefined, message: message.trim() });
      onDone();
    } catch {
      setError("Envoi impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const lbl = { fontFamily: T.fm, fontSize: 9, color: T.mut, margin: "12px 0 5px", display: "block" } as const;
  const inp = { width: "100%", border: `1px solid ${T.line}`, borderRadius: 11, padding: "11px 12px", fontSize: 13.5, fontFamily: T.fu, background: T.surf } as const;

  return (
    <div className="scr" style={{ padding: "8px 18px 14px" }}>
      <span style={lbl}>TYPE DE DEMANDE</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {TYPES.map((t) => (
          <div key={t.value} onClick={() => setType(t.value)} className="tap" style={{ padding: "8px 12px", borderRadius: 10, fontSize: 12, border: `1.5px solid ${type === t.value ? T.b600 : T.line}`, background: type === t.value ? "#eef3fc" : T.surf, color: type === t.value ? T.b600 : T.ink, fontWeight: type === t.value ? 600 : 400 }}>
            {t.label}
          </div>
        ))}
      </div>
      <span style={lbl}>SUJET</span>
      <input value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder="Ex. Correction de mon nom" style={inp} />
      {type === "modification_info" && (
        <>
          <span style={lbl}>CHAMP CONCERNÉ (optionnel)</span>
          <input value={champ} onChange={(e) => setChamp(e.target.value)} placeholder="Ex. nom, téléphone, ville..." style={inp} />
        </>
      )}
      <span style={lbl}>MOTIF / MESSAGE</span>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Expliquez votre demande. Joignez un justificatif via 'Mon dossier' si nécessaire." style={{ ...inp, resize: "vertical" }} />
      {error && <p style={{ color: T.dng, fontSize: 12 }}>{error}</p>}
      <div onClick={() => void submit()} className="tap" style={{ marginTop: 14, height: 48, background: busy ? T.faint : gradient, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14 }}>
        {busy ? "Envoi..." : "Envoyer la demande"}
      </div>
      <div onClick={onCancel} className="tap" style={{ textAlign: "center", padding: 12, color: T.mut, fontSize: 12.5 }}>Annuler</div>
    </div>
  );
}

function Thread({ token, id, onBack }: { token: string; id: string; onBack: () => void }): JSX.Element {
  const [detail, setDetail] = useState<DemandeDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = (): void => {
      getDemande(token, id).then((d) => alive && setDetail(d)).catch(() => undefined);
    };
    load();
    const t = window.setInterval(load, 5000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [token, id]);

  async function send(): Promise<void> {
    if (!draft.trim()) return;
    const corps = draft.trim();
    setDraft("");
    setBusy(true);
    try {
      const m = await sendDemandeMessage(token, id, corps);
      setDetail((prev) => (prev ? { ...prev, messages: [...prev.messages, m] } : prev));
    } finally {
      setBusy(false);
    }
  }

  const s = detail ? badgeFor(detail.statut) : null;

  return (
    <div className="scr" style={{ padding: "8px 16px 14px", display: "flex", flexDirection: "column", height: "100%" }}>
      <div onClick={onBack} className="tap" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 20, color: T.mut }}>‹</span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{detail?.sujet ?? "Demande"}</span>
        {s && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.fg }}>{s.label}</span>}
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 9, padding: "8px 2px" }}>
        {(detail?.messages ?? []).map((m: DemandeMessage) => {
          const mine = m.auteur_type === "membre";
          return (
            <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%" }}>
              <div style={{ background: mine ? T.b600 : T.surf, color: mine ? "#fff" : T.ink, border: mine ? "none" : `1px solid ${T.line}`, borderRadius: 13, padding: "9px 12px", fontSize: 13, lineHeight: 1.45 }}>
                {m.corps}
              </div>
              <div style={{ fontSize: 9, color: T.faint, margin: "3px 4px", textAlign: mine ? "right" : "left" }}>
                {mine ? "Vous" : m.auteur_nom ?? "Administration"} · {fmt(m.cree_le)}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 7, paddingTop: 8 }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void send()} placeholder="Votre message..." style={{ flex: 1, border: `1px solid ${T.line}`, borderRadius: 11, padding: "11px 12px", fontSize: 13, fontFamily: T.fu, background: T.surf }} />
        <div onClick={() => void send()} className="tap" style={{ width: 48, borderRadius: 11, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", opacity: busy ? 0.6 : 1 }}>➤</div>
      </div>
    </div>
  );
}
