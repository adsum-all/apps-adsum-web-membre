import { useEffect, useRef, useState } from "react";

import {
  type MembreProfile,
  type ProfilFields,
  type RefItem,
  getReference,
  soumettreInscription,
  updateProfil,
  uploadDocument,
  uploadPhoto,
} from "../api.js";
import { T, gradient } from "../proto.js";

interface Props {
  token: string;
  profile: MembreProfile | null;
  motif?: string | null;
  onSubmitted: () => void;
}

const GENRES = [
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
];
const SITUATIONS = [
  { value: "celibataire", label: "Célibataire" },
  { value: "en_couple", label: "En couple" },
  { value: "fiance", label: "Fiancé(e)" },
  { value: "marie", label: "Marié(e)" },
  { value: "veuf", label: "Veuf(ve)" },
  { value: "divorce", label: "Divorcé(e)" },
];
const PIECE_TYPES = [
  { value: "piece_identite", label: "Carte nationale d'identité" },
  { value: "passeport", label: "Passeport" },
  { value: "permis", label: "Permis de conduire" },
  { value: "carte_consulaire", label: "Carte consulaire" },
];

const lbl = { fontFamily: T.fm, fontSize: 9, color: T.mut, margin: "12px 0 5px", display: "block" } as const;
const inp = { width: "100%", border: `1px solid ${T.line}`, borderRadius: 11, padding: "11px 12px", fontSize: 13.5, fontFamily: T.fu, background: T.surf, boxSizing: "border-box" } as const;

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <span style={lbl}>
        {label.toUpperCase()} {required && <span style={{ color: T.dng }}>*</span>}
      </span>
      {children}
    </div>
  );
}

export function CompleterProfil({ token, profile, motif, onSubmitted }: Props): JSX.Element {
  const [tribus, setTribus] = useState<RefItem[]>([]);
  const [commissions, setCommissions] = useState<RefItem[]>([]);
  const [intendances, setIntendances] = useState<RefItem[]>([]);
  const [groupes, setGroupes] = useState<RefItem[]>([]);

  const [f, setF] = useState<ProfilFields>({
    prenoms: profile?.prenoms ?? "",
    nom: profile?.nom ?? "",
    telephone: profile?.telephone ?? "",
    date_naissance: profile?.date_naissance ?? "",
    genre: profile?.genre ?? "",
    pays: profile?.pays ?? "",
    ville: profile?.ville ?? "",
    tribu_id: "",
    situation_matrimoniale: profile?.situation_matrimoniale ?? "",
    profession: profile?.profession ?? "",
    niveau_etudes: profile?.niveau_etudes ?? "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [pieceType, setPieceType] = useState("piece_identite");
  const [pieceFile, setPieceFile] = useState<File | null>(null);
  const [consent, setConsent] = useState({ rgpd: false, confidentialite: false, engagement: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const pieceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getReference(token, "tribus").then(setTribus).catch(() => undefined);
    void getReference(token, "commissions").then(setCommissions).catch(() => undefined);
    void getReference(token, "intendances").then(setIntendances).catch(() => undefined);
    void getReference(token, "groupes").then(setGroupes).catch(() => undefined);
  }, [token]);

  function set<K extends keyof ProfilFields>(k: K, v: ProfilFields[K]): void {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  const requiredOk =
    !!f.prenoms?.trim() && !!f.nom?.trim() && !!f.telephone?.trim() && !!f.date_naissance &&
    !!f.genre && !!f.pays?.trim() && !!f.ville?.trim() && !!f.commission_id && !!f.tribu_id;
  const consentOk = consent.rgpd && consent.confidentialite && consent.engagement;
  const docsOk = !!photoFile && !!pieceFile;

  async function submit(): Promise<void> {
    setError(null);
    if (!requiredOk) {
      setError("Veuillez renseigner tous les champs obligatoires (*).");
      return;
    }
    if (!docsOk) {
      setError("La photo d'identité et une pièce d'identité sont obligatoires.");
      return;
    }
    if (!consentOk) {
      setError("Vous devez accepter les engagements pour soumettre.");
      return;
    }
    setBusy(true);
    try {
      await updateProfil(token, f);
      if (photoFile) await uploadPhoto(token, photoFile);
      if (pieceFile) await uploadDocument(token, pieceType, pieceFile);
      await soumettreInscription(token);
      onSubmitted();
    } catch {
      setError("Soumission impossible. Vérifiez vos informations et réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="scr" style={{ padding: "10px 18px 28px", overflowY: "auto" }}>
      <div style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 19 }}>Compléter mon inscription</div>
      <p style={{ fontSize: 12.5, color: T.mut, lineHeight: 1.55, margin: "6px 0 4px" }}>
        Renseignez vos informations. Les champs marqués <span style={{ color: T.dng }}>*</span> sont obligatoires. Votre dossier sera examiné par l'administration.
      </p>
      {motif && (
        <p style={{ background: "#fdf1dd", border: "1px solid #e3b765", borderRadius: 11, padding: 11, fontSize: 12, color: "#8a5a12", margin: "8px 0" }}>
          Modification demandée : {motif}
        </p>
      )}

      <p style={{ fontFamily: T.fm, fontSize: 9, letterSpacing: 0.8, color: T.b600, margin: "16px 2px 2px" }}>IDENTITÉ</p>
      <Field label="Prénoms" required><input style={inp} value={f.prenoms} onChange={(e) => set("prenoms", e.target.value)} /></Field>
      <Field label="Nom" required><input style={inp} value={f.nom} onChange={(e) => set("nom", e.target.value)} /></Field>
      <Field label="Genre" required>
        <select style={inp} value={f.genre} onChange={(e) => set("genre", e.target.value)}>
          <option value="">Sélectionner...</option>
          {GENRES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
      </Field>
      <Field label="Date de naissance" required><input type="date" style={inp} value={f.date_naissance} onChange={(e) => set("date_naissance", e.target.value)} /></Field>
      <Field label="Téléphone" required><input type="tel" style={inp} value={f.telephone} onChange={(e) => set("telephone", e.target.value)} placeholder="+225..." /></Field>

      <p style={{ fontFamily: T.fm, fontSize: 9, letterSpacing: 0.8, color: T.b600, margin: "18px 2px 2px" }}>LOCALISATION & RATTACHEMENT</p>
      <Field label="Pays" required><input style={inp} value={f.pays} onChange={(e) => set("pays", e.target.value)} /></Field>
      <Field label="Ville" required><input style={inp} value={f.ville} onChange={(e) => set("ville", e.target.value)} /></Field>
      <Field label="Commission" required>
        <select style={inp} value={f.commission_id ?? ""} onChange={(e) => set("commission_id", e.target.value)}>
          <option value="">Sélectionner...</option>
          {commissions.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </Field>
      <Field label="Groupe">
        <select style={inp} value={f.groupe ?? ""} onChange={(e) => set("groupe", e.target.value)}>
          <option value="">Sélectionner...</option>
          {groupes.map((g) => <option key={g.id} value={g.nom}>{g.nom}</option>)}
        </select>
      </Field>
      <Field label="Intendance">
        <select style={inp} value={f.intendance_id ?? ""} onChange={(e) => set("intendance_id", e.target.value)}>
          <option value="">Sélectionner...</option>
          {intendances.map((i) => <option key={i.id} value={i.id}>{i.nom}</option>)}
        </select>
      </Field>
      <Field label="Tribu" required>
        <select style={inp} value={f.tribu_id ?? ""} onChange={(e) => set("tribu_id", e.target.value)}>
          <option value="">Sélectionner...</option>
          {tribus.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
        </select>
      </Field>

      <p style={{ fontFamily: T.fm, fontSize: 9, letterSpacing: 0.8, color: T.b600, margin: "18px 2px 2px" }}>VIE PERSONNELLE (facultatif)</p>
      <Field label="Situation matrimoniale">
        <select style={inp} value={f.situation_matrimoniale ?? ""} onChange={(e) => set("situation_matrimoniale", e.target.value)}>
          <option value="">Sélectionner...</option>
          {SITUATIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </Field>
      <Field label="Profession"><input style={inp} value={f.profession} onChange={(e) => set("profession", e.target.value)} /></Field>
      <Field label="Niveau d'études"><input style={inp} value={f.niveau_etudes} onChange={(e) => set("niveau_etudes", e.target.value)} /></Field>

      <p style={{ fontFamily: T.fm, fontSize: 9, letterSpacing: 0.8, color: T.b600, margin: "18px 2px 2px" }}>PIÈCES JUSTIFICATIVES</p>
      <Field label="Photo d'identité" required>
        <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
        <div onClick={() => photoRef.current?.click()} className="tap" style={{ ...inp, color: photoFile ? T.ink : T.mut, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{photoFile ? photoFile.name : "Choisir une photo..."}</span>
          <span style={{ color: photoFile ? T.ok : T.b600 }}>{photoFile ? "✓" : "⤴"}</span>
        </div>
      </Field>
      <Field label="Type de pièce" required>
        <select style={inp} value={pieceType} onChange={(e) => setPieceType(e.target.value)}>
          {PIECE_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </Field>
      <Field label="Document (pièce d'identité)" required>
        <input ref={pieceRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => setPieceFile(e.target.files?.[0] ?? null)} />
        <div onClick={() => pieceRef.current?.click()} className="tap" style={{ ...inp, color: pieceFile ? T.ink : T.mut, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{pieceFile ? pieceFile.name : "Choisir un fichier (image ou PDF)..."}</span>
          <span style={{ color: pieceFile ? T.ok : T.b600 }}>{pieceFile ? "✓" : "⤴"}</span>
        </div>
      </Field>

      <p style={{ fontFamily: T.fm, fontSize: 9, letterSpacing: 0.8, color: T.b600, margin: "18px 2px 8px" }}>ENGAGEMENTS</p>
      {([
        ["rgpd", "J'accepte la politique de protection des données (RGPD)"],
        ["confidentialite", "J'accepte la charte de confidentialité"],
        ["engagement", "Je lis et signe la lettre d'engagement"],
      ] as const).map(([k, label]) => (
        <label key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 8, border: `1px solid ${consent[k] ? T.ok : T.line}`, borderRadius: 11, background: consent[k] ? T.okbg : T.surf, fontSize: 12.5 }}>
          <input type="checkbox" checked={consent[k]} onChange={(e) => setConsent((p) => ({ ...p, [k]: e.target.checked }))} style={{ width: 18, height: 18, accentColor: T.b600 }} />
          {label} <span style={{ color: T.dng }}>*</span>
        </label>
      ))}

      {error && <p style={{ color: T.dng, fontSize: 12.5, marginTop: 10 }}>{error}</p>}

      <div onClick={() => void submit()} className="tap" style={{ marginTop: 16, height: 50, background: busy ? T.faint : gradient, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 15, boxShadow: "0 12px 24px -10px rgba(42,79,173,.7)" }}>
        {busy ? "Envoi en cours..." : "Soumettre mon inscription"}
      </div>
    </div>
  );
}
