import { useEffect, useRef, useState } from "react";

import {
  type MembreProfile,
  type ProfilFields,
  type RefItem,
  getReference,
  soumettreInscription,
  telegramLien,
  updateProfil,
  uploadDocument,
  uploadPhoto,
} from "../api.js";
import { T, gradient } from "../proto.js";
import { PaysSelect, PhoneField, indicatifDePays } from "./FormFields.js";
import { InfoTip } from "./InfoTip.js";

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

function Field({ label, required, info, children }: { label: string; required?: boolean; info?: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <span style={lbl}>
        {label.toUpperCase()} {required && <span style={{ color: T.dng }}>*</span>}
        {info && <InfoTip text={info} />}
      </span>
      {children}
    </div>
  );
}

function TelegramInvite({ token }: { token: string }): JSX.Element {
  const [done, setDone] = useState(false);
  async function rejoindre(): Promise<void> {
    try {
      const r = await telegramLien(token);
      window.open(r.deep_link, "_blank", "noopener");
      setDone(true);
    } catch {
      // Telegram non configuré : on n'affiche pas d'erreur bloquante.
    }
  }
  return (
    <div style={{ background: "linear-gradient(135deg,#eaf0ff,#f4f6fb)", border: `1px solid ${T.line}`, borderRadius: 13, padding: "12px 14px", margin: "10px 0 2px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 24 }}>✈️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: T.fd }}>Recevez vos notifications sur Telegram</div>
          <div style={{ fontSize: 11, color: T.mut, lineHeight: 1.45 }}>Gratuit. Une seule fois : appuyez sur « Démarrer », puis tout arrive automatiquement (rappels, événements, anniversaire).</div>
        </div>
      </div>
      <div
        onClick={() => void rejoindre()}
        className="tap"
        style={{ marginTop: 10, height: 40, borderRadius: 10, background: done ? T.okbg : T.b600, color: done ? T.ok : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13 }}
      >
        {done ? "Ouvert dans Telegram - appuyez sur Démarrer ✓" : "Rejoindre Telegram"}
      </div>
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
    indicatif_telephone: profile?.indicatif_telephone ?? "",
    date_naissance: profile?.date_naissance ?? "",
    naissance_annee_visible: profile?.naissance_annee_visible ?? false,
    genre: profile?.genre ?? "",
    pays: profile?.pays ?? "",
    region: profile?.region ?? "",
    ville: profile?.ville ?? "",
    adresse: profile?.adresse ?? "",
    adresse_complement: profile?.adresse_complement ?? "",
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
    !!f.prenoms?.trim() && !!f.nom?.trim() && !!f.telephone?.trim() && !!f.indicatif_telephone?.trim() &&
    !!f.date_naissance && !!f.genre && !!f.pays?.trim() && !!f.ville?.trim() && !!f.commission_id && !!f.tribu_id;
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

      <TelegramInvite token={token} />


      <p style={{ fontFamily: T.fm, fontSize: 9, letterSpacing: 0.8, color: T.b600, margin: "16px 2px 2px" }}>IDENTITÉ</p>
      <Field label="Prénoms" required info="Vos prénoms tels qu'ils figurent sur votre pièce d'identité."><input style={inp} value={f.prenoms} onChange={(e) => set("prenoms", e.target.value)} /></Field>
      <Field label="Nom" required info="Votre nom de famille, tel qu'il figure sur votre pièce d'identité."><input style={inp} value={f.nom} onChange={(e) => set("nom", e.target.value)} /></Field>
      <Field label="Genre" required>
        <select style={inp} value={f.genre} onChange={(e) => set("genre", e.target.value)}>
          <option value="">Sélectionner...</option>
          {GENRES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
      </Field>
      <Field label="Date de naissance" required info="Votre date complète. Par défaut, seuls le jour et le mois seront visibles sur votre profil (pour l'anniversaire) ; l'année reste masquée sauf si vous cochez la case ci-dessous."><input type="date" style={inp} value={f.date_naissance} onChange={(e) => set("date_naissance", e.target.value)} /></Field>
      <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 2px 2px", fontSize: 12, color: T.mut }}>
        <input type="checkbox" checked={!!f.naissance_annee_visible} onChange={(e) => set("naissance_annee_visible", e.target.checked)} style={{ width: 17, height: 17, accentColor: T.b600 }} />
        Afficher mon année de naissance sur mon profil (sinon seul le jour et le mois, pour l'anniversaire, sont visibles)
      </label>
      <Field label="Téléphone" required info="Choisissez d'abord l'indicatif (le pays du numéro), puis saisissez votre numéro. L'indicatif peut être différent de votre pays de résidence.">
        <PhoneField
          indicatif={f.indicatif_telephone ?? ""}
          numero={f.telephone ?? ""}
          onIndicatif={(i) => set("indicatif_telephone", i)}
          onNumero={(n) => set("telephone", n)}
        />
      </Field>

      <p style={{ fontFamily: T.fm, fontSize: 9, letterSpacing: 0.8, color: T.b600, margin: "18px 2px 2px" }}>LOCALISATION & RATTACHEMENT</p>
      <Field label="Pays" required info="Votre pays de résidence. Utilisez la recherche pour le trouver rapidement.">
        <PaysSelect
          value={f.pays ?? ""}
          onChange={(nom) => {
            set("pays", nom);
            // Prefill the phone dialling code from the country only if none chosen yet.
            if (!f.indicatif_telephone) set("indicatif_telephone", indicatifDePays(nom));
          }}
        />
      </Field>
      <Field label="Région / État"><input style={inp} value={f.region ?? ""} onChange={(e) => set("region", e.target.value)} placeholder="Ex. Île-de-France, Californie..." /></Field>
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

      <p style={{ fontFamily: T.fm, fontSize: 9, letterSpacing: 0.8, color: T.b600, margin: "18px 2px 2px" }}>ADRESSE (facultatif)</p>
      <p style={{ fontSize: 11, color: T.mut, lineHeight: 1.5, margin: "2px 2px 6px" }}>
        Une indication générale suffit (quartier, secteur). Ne renseignez pas d'adresse précise.
      </p>
      <Field label="Adresse (générale)" info="Une indication générale suffit (quartier, secteur). Ne renseignez jamais une adresse précise, pour votre sécurité."><input style={inp} value={f.adresse ?? ""} onChange={(e) => set("adresse", e.target.value)} placeholder="Ex. Cocody, quartier des Deux-Plateaux" /></Field>
      <Field label="Complément (facultatif)"><input style={inp} value={f.adresse_complement ?? ""} onChange={(e) => set("adresse_complement", e.target.value)} placeholder="Précision libre, si vous le souhaitez" /></Field>

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
