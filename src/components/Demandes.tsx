import { useEffect, useRef, useState } from "react";

import {
  type CatalogueCategorie,
  type CatalogueSous,
  type DemandeDetail,
  type DemandeMessage,
  createDemande,
  getDemande,
  getDemandeCatalogue,
  getDemandes,
  sendDemandeMessage,
  uploadDocument,
} from "../api.js";
import { T, gradient } from "../proto.js";
import { useResource } from "../useResource.js";

interface Badge {
  label: string;
  bg: string;
  fg: string;
}
const DEFAULT_BADGE: Badge = { label: "Ouverte", bg: T.warnbg, fg: T.warn };
const STATUT_BADGE: Record<string, Badge> = {
  ouverte: DEFAULT_BADGE,
  en_cours: { label: "En cours", bg: "#eef3fc", fg: T.b600 },
  pieces_demandees: { label: "Pièces demandées", bg: T.warnbg, fg: T.warn },
  attente_membre: { label: "À vous de répondre", bg: T.warnbg, fg: T.warn },
  en_validation: { label: "En validation", bg: "#eef3fc", fg: T.b600 },
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

/** Step path of a request, so the member sees at a glance what has been done,
 * where the request stands now and what remains until it is closed. */
function Etapes({ d }: { d: DemandeDetail }): JSX.Element {
  const closed = d.statut === "resolue" || d.statut === "refusee";
  const enCharge = Boolean(d.pris_en_charge_le) || d.statut !== "ouverte";
  const traitementLabel: Record<string, string> = {
    en_cours: "En cours de traitement",
    pieces_demandees: "Pièces attendues de vous",
    attente_membre: "Réponse attendue de vous",
    en_validation: "En validation",
  };
  const steps: { label: string; date?: string | null; state: "done" | "current" | "todo" }[] = [
    { label: "Envoyée", date: d.cree_le, state: "done" },
    {
      label: "Prise en charge",
      date: d.pris_en_charge_le,
      state: enCharge ? "done" : "current",
    },
    {
      label: traitementLabel[d.statut] ?? "Traitement",
      state: closed ? "done" : enCharge ? "current" : "todo",
    },
    {
      label: d.statut === "resolue" ? "Résolue" : d.statut === "refusee" ? "Refusée" : "Clôture",
      date: d.clos_le,
      state: closed ? "done" : "todo",
    },
  ];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, background: T.surf, border: `1px solid ${T.line}`, borderRadius: 12, padding: "10px 8px", margin: "6px 0 4px" }}>
      {steps.map((s, i) => {
        const color = s.state === "done" ? T.ok : s.state === "current" ? T.b600 : T.faint;
        return (
          <div key={s.label} style={{ flex: 1, textAlign: "center", position: "relative" }}>
            {i > 0 && (
              <div style={{ position: "absolute", left: "-50%", right: "50%", top: 8, height: 2, background: s.state === "todo" ? T.line : T.ok }} />
            )}
            <div style={{ position: "relative", width: 16, height: 16, margin: "0 auto", borderRadius: "50%", background: s.state === "todo" ? T.bg : color, border: `2px solid ${color}`, color: "#fff", fontSize: 9, lineHeight: "12px", fontWeight: 700 }}>
              {s.state === "done" ? "✓" : ""}
            </div>
            <div style={{ fontSize: 9.5, fontWeight: s.state === "current" ? 700 : 500, color: s.state === "todo" ? T.mut : T.ink, marginTop: 4, lineHeight: 1.25 }}>{s.label}</div>
            {s.date && <div style={{ fontSize: 8.5, color: T.mut }}>{fmt(s.date)}</div>}
          </div>
        );
      })}
    </div>
  );
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
              <div style={{ fontSize: 10.5, color: T.mut }}>
                <span style={{ fontFamily: T.fm }}>{d.numero}</span> · {d.nb_messages} message(s) · {fmt(d.cree_le)}
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "4px 9px", borderRadius: 20, background: s.bg, color: s.fg }}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Guided creation: pick a category, pick a request, the subject and message
 * come prewritten (editable). No document needed to submit; the member can
 * attach one later inside the ticket thread. */
function NewDemande({ token, onDone, onCancel }: { token: string; onDone: () => void; onCancel: () => void }): JSX.Element {
  const catalogue = useResource(() => getDemandeCatalogue(token), [token]);
  const [cat, setCat] = useState<CatalogueCategorie | null>(null);
  const [sous, setSous] = useState<CatalogueSous | null>(null);
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick(c: CatalogueCategorie, s: CatalogueSous): void {
    setCat(c);
    setSous(s);
    setSujet(s.sujet);
    setMessage(s.message);
  }

  async function submit(): Promise<void> {
    if (!cat || !sous) {
      setError("Choisissez d'abord le type de votre demande.");
      return;
    }
    if (!sujet.trim() || !message.trim()) {
      setError("Sujet et message requis.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createDemande(token, {
        type: cat.categorie === "autre" ? "autre" : "modification_info",
        sujet: sujet.trim(),
        message: message.trim(),
        categorie: cat.categorie,
        sous_categorie: sous.cle,
      });
      onDone();
    } catch {
      setError("Envoi impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const lbl = { fontFamily: T.fm, fontSize: 9, color: T.mut, margin: "12px 0 5px", display: "block" } as const;
  const inp = { width: "100%", border: `1px solid ${T.line}`, borderRadius: 11, padding: "11px 12px", fontSize: 13.5, fontFamily: T.fu, background: T.surf } as const;
  const cats = catalogue.data?.categories ?? [];

  return (
    <div className="scr" style={{ padding: "8px 18px 14px" }}>
      <span style={lbl}>1. CATÉGORIE</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {cats.map((c) => (
          <div key={c.categorie} onClick={() => { setCat(c); setSous(null); }} className="tap" style={{ padding: "8px 12px", borderRadius: 10, fontSize: 12, border: `1.5px solid ${cat?.categorie === c.categorie ? T.b600 : T.line}`, background: cat?.categorie === c.categorie ? "#eef3fc" : T.surf, color: cat?.categorie === c.categorie ? T.b600 : T.ink, fontWeight: cat?.categorie === c.categorie ? 600 : 400 }}>
            {c.libelle}
          </div>
        ))}
      </div>
      {cat && (
        <>
          <span style={lbl}>2. VOTRE DEMANDE</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {cat.sous.map((s) => (
              <div key={s.cle} onClick={() => pick(cat, s)} className="tap" style={{ padding: "10px 12px", borderRadius: 11, fontSize: 12.5, border: `1.5px solid ${sous?.cle === s.cle ? T.b600 : T.line}`, background: sous?.cle === s.cle ? "#eef3fc" : T.surf, fontWeight: sous?.cle === s.cle ? 600 : 400 }}>
                {s.libelle}
              </div>
            ))}
          </div>
        </>
      )}
      {sous && (
        <>
          <span style={lbl}>3. SUJET</span>
          <input value={sujet} onChange={(e) => setSujet(e.target.value)} style={inp} />
          <span style={lbl}>4. MESSAGE (pré-rédigé, complétez si besoin)</span>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} style={{ ...inp, resize: "vertical" }} />
          <p style={{ fontSize: 11, color: T.mut, lineHeight: 1.5, margin: "8px 2px 0" }}>
            {sous.piece === "recommandée"
              ? "Une pièce justificative est recommandée : vous pourrez la joindre dans la conversation, juste après l'envoi."
              : "Aucune pièce n'est requise pour envoyer cette demande. Vous pourrez en joindre une plus tard si l'administration en a besoin."}
          </p>
        </>
      )}
      {error && <p style={{ color: T.dng, fontSize: 12 }}>{error}</p>}
      {sous && (
        <div onClick={busy ? undefined : () => void submit()} className="tap" style={{ marginTop: 14, height: 48, background: busy ? T.faint : gradient, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14 }}>
          {busy ? "Envoi..." : "Envoyer la demande"}
        </div>
      )}
      <div onClick={onCancel} className="tap" style={{ textAlign: "center", padding: 12, color: T.mut, fontSize: 12.5 }}>Annuler</div>
    </div>
  );
}

function Thread({ token, id, onBack }: { token: string; id: string; onBack: () => void }): JSX.Element {
  const [detail, setDetail] = useState<DemandeDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  async function joindre(file: File): Promise<void> {
    setBusy(true);
    setNote(null);
    try {
      const docId = await uploadDocument(token, "autre", file);
      const m = await sendDemandeMessage(token, id, `Pièce jointe : ${file.name}`, docId);
      setDetail((prev) => (prev ? { ...prev, messages: [...prev.messages, m] } : prev));
      setNote("Pièce envoyée dans la demande.");
    } catch {
      setNote("Envoi de la pièce impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const s = detail ? badgeFor(detail.statut) : null;

  return (
    <div className="scr" style={{ padding: "8px 16px 14px", display: "flex", flexDirection: "column", height: "100%" }}>
      <div onClick={onBack} className="tap" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        <span style={{ fontSize: 20, color: T.mut }}>‹</span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{detail?.sujet ?? "Demande"}</span>
        {s && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.fg }}>{s.label}</span>}
      </div>
      {detail && (
        <div style={{ fontSize: 10, color: T.mut, margin: "0 0 4px 28px", fontFamily: T.fm }}>
          {detail.numero} · ouverte le {fmt(detail.cree_le)}
          {detail.motif_cloture ? ` · motif : ${detail.motif_cloture}` : ""}
        </div>
      )}
      {detail && <Etapes d={detail} />}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 9, padding: "8px 2px" }}>
        {(detail?.messages ?? []).map((m: DemandeMessage) => {
          if (m.auteur_type === "systeme") {
            return (
              <div key={m.id} style={{ alignSelf: "center", maxWidth: "92%", textAlign: "center" }}>
                <span style={{ fontSize: 10.5, color: T.mut, background: T.bg, border: `1px dashed ${T.line}`, borderRadius: 10, padding: "4px 10px", display: "inline-block" }}>
                  {m.corps} · {fmt(m.cree_le)}
                </span>
              </div>
            );
          }
          const mine = m.auteur_type === "membre";
          return (
            <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%" }}>
              <div style={{ background: mine ? T.b600 : T.surf, color: mine ? "#fff" : T.ink, border: mine ? "none" : `1px solid ${T.line}`, borderRadius: 13, padding: "9px 12px", fontSize: 13, lineHeight: 1.45 }}>
                {m.corps}
                {m.document_id && <div style={{ fontSize: 10.5, marginTop: 4, opacity: 0.85 }}>Document joint à la demande</div>}
              </div>
              <div style={{ fontSize: 9, color: T.faint, margin: "3px 4px", textAlign: mine ? "right" : "left" }}>
                {mine ? "Vous" : m.auteur_nom ?? "Administration"} · {fmt(m.cree_le)}
                {mine && m.lu_par_staff_le ? <span style={{ color: T.ok, fontWeight: 700 }}> · Lu {fmt(m.lu_par_staff_le)}</span> : mine ? " · Envoyé" : ""}
              </div>
            </div>
          );
        })}
      </div>
      {detail?.statut === "pieces_demandees" && (
        <p style={{ fontSize: 11.5, color: "#8a5a12", background: T.warnbg, border: `1px solid ${T.warn}`, borderRadius: 10, padding: "8px 10px", margin: "0 0 6px" }}>
          L'administration attend une pièce : utilisez le trombone pour la joindre ici.
        </p>
      )}
      {detail?.statut === "attente_membre" && (
        <p style={{ fontSize: 11.5, color: "#8a5a12", background: T.warnbg, border: `1px solid ${T.warn}`, borderRadius: 10, padding: "8px 10px", margin: "0 0 6px" }}>
          L'administration attend votre réponse : écrivez-la ci-dessous pour que le traitement continue.
          {detail.echeance_reponse
            ? ` À faire avant le ${new Date(detail.echeance_reponse).toLocaleDateString("fr-FR")}, sinon la demande sera clôturée sans suite.`
            : ""}
        </p>
      )}
      {(detail?.statut === "en_cours" || detail?.statut === "en_validation") && (
        <p style={{ fontSize: 11, color: T.mut, margin: "0 0 6px" }}>
          Aucune action attendue de votre part pour le moment : l'administration traite votre demande.
        </p>
      )}
      {note && <p style={{ fontSize: 11, color: T.mut, margin: "0 0 4px" }}>{note}</p>}
      <div style={{ display: "flex", gap: 7, paddingTop: 8 }}>
        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) void joindre(f); e.target.value = ""; }} />
        <div onClick={busy ? undefined : () => fileRef.current?.click()} className="tap" title="Joindre une pièce" style={{ width: 46, borderRadius: 11, border: `1.5px solid ${T.line}`, background: T.surf, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: T.b600 }}>
          +
        </div>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void send()} placeholder="Votre message..." style={{ flex: 1, border: `1px solid ${T.line}`, borderRadius: 11, padding: "11px 12px", fontSize: 13, fontFamily: T.fu, background: T.surf }} />
        <div onClick={() => void send()} className="tap" style={{ width: 48, borderRadius: 11, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", opacity: busy ? 0.6 : 1 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z" /></svg>
        </div>
      </div>
    </div>
  );
}
