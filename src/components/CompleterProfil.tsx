import { useEffect, useMemo, useRef, useState } from "react";

import {
  ApiError,
  type DocumentItem,
  type FonctionItem,
  type MembreProfile,
  type ProfilFields,
  type RefItem,
  getDocuments,
  getFonctions,
  getReference,
  isNeedsSignature,
  soumettreInscription,
  soumettreReason,
  updateProfil,
  uploadDocument,
  uploadPhoto,
} from "../api.js";
import { useT } from "../i18n.js";
import { T, gradient } from "../proto.js";
import {
  DOC_TYPES,
  Field,
  GENRES,
  RecapRow,
  SITUATIONS,
  STATUTS,
  Stepper,
  TelegramInvite,
  WIZARD_STEPS,
  WizardNav,
  baseInp,
  initialFields,
} from "./CompleterProfilParts.js";
import { PaysSelect, PhoneField, indicatifDePays } from "./FormFields.js";
import { PiecesJustificatives } from "./PiecesJustificatives.js";
import { SignatureEngagement } from "./SignatureEngagement.js";

interface Props {
  token: string;
  profile: MembreProfile | null;
  statut?: string;
  motif?: string | null;
  champsACorriger?: string[];
  onSubmitted: () => void;
}

/** Which wizard step owns each field, used to jump straight to a correction. */
const FIELD_STEP: Record<string, number> = {
  prenoms: 0, nom: 0, genre: 0, date_naissance: 0, telephone: 0, indicatif_telephone: 0,
  pays: 1, region: 1, ville: 1, commission_id: 1, groupe: 1, intendance_id: 1, tribu_id: 1,
  type_membre: 2, fonction_cle: 2, adresse: 2, adresse_complement: 2,
  situation_matrimoniale: 2, profession: 2, niveau_etudes: 2,
  photo: 3, piece: 3,
};

/** Human-readable reason for a failure while saving the profile or files, so
 * the member sees what to fix rather than a generic "Soumission impossible". */
function saveReason(err: unknown): string {
  if (err instanceof ApiError) {
    const detail = err.detail as { locked_fields?: string[] } | undefined;
    if (err.status === 403 && Array.isArray(detail?.locked_fields) && detail.locked_fields.length > 0) {
      return `Certains champs ne sont plus modifiables : ${detail.locked_fields.join(", ")}.`;
    }
    if (err.status === 413) {
      return "Un fichier est trop volumineux. Réduisez sa taille et réessayez.";
    }
  }
  return "Impossible d'enregistrer vos informations. Vérifiez les champs, puis réessayez.";
}

export function CompleterProfil({ token, profile, statut, motif, champsACorriger = [], onSubmitted }: Props): JSX.Element {
  const t = useT();
  const correction = statut === "modification_demandee";
  const flagged = useMemo(() => new Set(champsACorriger), [champsACorriger]);
  const hl = (name: string): boolean => correction && flagged.has(name);

  const [tribus, setTribus] = useState<RefItem[]>([]);
  const [commissions, setCommissions] = useState<RefItem[]>([]);
  const [intendances, setIntendances] = useState<RefItem[]>([]);
  const [groupes, setGroupes] = useState<RefItem[]>([]);
  const [fonctions, setFonctions] = useState<FonctionItem[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);

  const [f, setF] = useState<ProfilFields>(() => initialFields(profile));
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [pieceType, setPieceType] = useState("piece_identite");
  const [pieceFile, setPieceFile] = useState<File | null>(null);
  const [signed, setSigned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const topRef = useRef<HTMLDivElement | null>(null);

  // Reset the form when a profile finishes loading after first paint, so late
  // data still prefills every field (the member must never lose entered data).
  const loadedId = useRef<string | null>(null);
  useEffect(() => {
    if (profile && profile.id !== loadedId.current) {
      loadedId.current = profile.id;
      setF(initialFields(profile));
    }
  }, [profile]);

  useEffect(() => {
    void getReference(token, "tribus").then(setTribus).catch(() => undefined);
    void getReference(token, "commissions").then(setCommissions).catch(() => undefined);
    void getReference(token, "intendances").then(setIntendances).catch(() => undefined);
    void getReference(token, "groupes").then(setGroupes).catch(() => undefined);
    void getFonctions(token).then((list) => setFonctions(list.filter((x) => x.actif))).catch(() => undefined);
    void getDocuments(token).then(setDocs).catch(() => undefined);
  }, [token]);

  function set<K extends keyof ProfilFields>(k: K, v: ProfilFields[K]): void {
    setF((prev) => ({ ...prev, [k]: v }));
  }
  function inp(name: string): React.CSSProperties {
    return hl(name) ? { ...baseInp, border: `1px solid ${T.warn}` } : baseInp;
  }

  const photoProvided = !!profile?.photo_url;
  const pieceProvided = docs.some((d) => d.type != null && DOC_TYPES.includes(d.type));

  const requiredOk =
    !!f.prenoms?.trim() && !!f.nom?.trim() && !!f.telephone?.trim() && !!f.indicatif_telephone?.trim() &&
    !!f.date_naissance && !!f.genre && !!f.pays?.trim() && !!f.ville?.trim() && !!f.commission_id && !!f.tribu_id;
  // A document is required only if it is not already provided, or if it was
  // explicitly flagged for correction.
  const photoOk = photoProvided ? true : !!photoFile;
  const pieceOk = pieceProvided ? true : !!pieceFile;
  const photoNeedsRedo = hl("photo") && !photoFile;
  const pieceNeedsRedo = hl("piece") && !pieceFile;

  /** Blocking message of a step, or null when the member can move on. */
  function stepBlocker(i: number): string | null {
    if (i === 0) {
      if (!f.prenoms?.trim() || !f.nom?.trim() || !f.genre || !f.date_naissance) {
        return "Veuillez renseigner vos prénoms, nom, genre et date de naissance.";
      }
      if (!f.telephone?.trim() || !f.indicatif_telephone?.trim()) {
        return "Veuillez renseigner votre téléphone (indicatif et numéro).";
      }
      return null;
    }
    if (i === 1) {
      if (!f.pays?.trim() || !f.ville?.trim()) return "Veuillez renseigner votre pays et votre ville.";
      if (!f.commission_id || !f.tribu_id) return "Veuillez choisir votre commission et votre tribu.";
      return null;
    }
    if (i === 3) {
      if (!photoOk || !pieceOk) return "La photo d'identité et une pièce d'identité sont obligatoires.";
      if (photoNeedsRedo || pieceNeedsRedo) return "Un document à corriger doit être renvoyé.";
      return null;
    }
    if (i === 4 && !signed) return t("consent.signBeforeSubmit");
    return null;
  }

  function goTo(i: number): void {
    setError(null);
    setStep(Math.max(0, Math.min(WIZARD_STEPS.length - 1, i)));
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  function goNext(): void {
    const blocker = stepBlocker(step);
    if (blocker) {
      setError(blocker);
      return;
    }
    goTo(step + 1);
  }

  const firstFlaggedStep = useMemo(() => {
    const steps = champsACorriger.map((c) => FIELD_STEP[c]).filter((s) => s !== undefined);
    return steps.length ? Math.min(...steps) : null;
  }, [champsACorriger]);

  async function submit(): Promise<void> {
    setError(null);
    if (!requiredOk) {
      setError("Veuillez renseigner tous les champs obligatoires (*).");
      return;
    }
    if (!photoOk || !pieceOk) {
      setError("La photo d'identité et une pièce d'identité sont obligatoires.");
      return;
    }
    if (photoNeedsRedo || pieceNeedsRedo) {
      setError("Un document à corriger doit être renvoyé.");
      return;
    }
    if (!signed) {
      setError(t("consent.signBeforeSubmit"));
      return;
    }
    setBusy(true);
    try {
      // Phase 1: persist the profile and any new files. A failure here is about
      // saving the data, not about the final submission gate.
      try {
        await updateProfil(token, f);
        if (photoFile) await uploadPhoto(token, photoFile);
        if (pieceFile) await uploadDocument(token, pieceType, pieceFile);
      } catch (saveErr) {
        setError(saveReason(saveErr));
        return;
      }
      // Phase 2: the server-side submission gate (fields, document, signature).
      await soumettreInscription(token);
      onSubmitted();
    } catch (err) {
      if (isNeedsSignature(err)) {
        setSigned(false);
        setError(t("consent.signBeforeSubmit"));
        goTo(4);
      } else {
        // Surface the precise server reason (missing field, document) instead
        // of a generic message that hides why the submission was refused.
        setError(soumettreReason(err) ?? "Soumission impossible. Vérifiez vos informations et réessayez.");
      }
    } finally {
      setBusy(false);
    }
  }

  const commissionNom = commissions.find((c) => c.id === f.commission_id)?.nom ?? "";
  const tribuNom = tribus.find((x) => x.id === f.tribu_id)?.nom ?? "";

  return (
    <div ref={topRef} className="scr" style={{ padding: "10px 18px 28px" }}>
      <div style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 19 }}>Compléter mon inscription</div>
      <p style={{ fontSize: 12.5, color: T.mut, lineHeight: 1.55, margin: "6px 0 4px" }}>
        Avancez étape par étape. Les champs marqués <span style={{ color: T.dng }}>*</span> sont obligatoires. Vos saisies sont conservées d'une étape à l'autre.
      </p>
      {correction && (
        <div style={{ background: T.warnbg, border: `1px solid ${T.warn}`, borderRadius: 11, padding: 12, margin: "8px 0" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#8a5a12" }}>
            {motif ? t("correction.banner").replace("{motif}", motif) : t("correction.bannerNoMotif")}
          </div>
          {champsACorriger.length > 0 && (
            <div style={{ fontSize: 11, color: "#8a5a12", marginTop: 6 }}>
              {t("correction.fieldsIntro")} : {champsACorriger.join(", ")}
            </div>
          )}
          {firstFlaggedStep !== null && firstFlaggedStep !== step && (
            <div onClick={() => goTo(firstFlaggedStep)} className="tap" style={{ marginTop: 8, height: 36, borderRadius: 9, background: T.warn, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12 }}>
              Aller au premier champ à corriger
            </div>
          )}
        </div>
      )}

      <Stepper step={step} />

      {step === 0 && (
        <>
          <TelegramInvite token={token} />
          <Field label="Prénoms" required highlight={hl("prenoms")} info="Vos prénoms tels qu'ils figurent sur votre pièce d'identité."><input style={inp("prenoms")} value={f.prenoms} onChange={(e) => set("prenoms", e.target.value)} /></Field>
          <Field label="Nom" required highlight={hl("nom")} info="Votre nom de famille, tel qu'il figure sur votre pièce d'identité."><input style={inp("nom")} value={f.nom} onChange={(e) => set("nom", e.target.value)} /></Field>
          <Field label="Genre" required highlight={hl("genre")}>
            <select style={inp("genre")} value={f.genre} onChange={(e) => set("genre", e.target.value)}>
              <option value="">Sélectionner...</option>
              {GENRES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </Field>
          <Field label="Date de naissance" required highlight={hl("date_naissance")} info="Votre date complète. Par défaut, seuls le jour et le mois seront visibles sur votre profil (pour l'anniversaire) ; l'année reste masquée sauf si vous cochez la case ci-dessous."><input type="date" style={inp("date_naissance")} value={f.date_naissance} onChange={(e) => set("date_naissance", e.target.value)} /></Field>
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 2px 2px", fontSize: 12, color: T.mut }}>
            <input type="checkbox" checked={!!f.naissance_annee_visible} onChange={(e) => set("naissance_annee_visible", e.target.checked)} style={{ width: 17, height: 17, accentColor: T.b600 }} />
            Afficher mon année de naissance sur mon profil (sinon seul le jour et le mois, pour l'anniversaire, sont visibles)
          </label>
          <Field label="Téléphone" required highlight={hl("telephone")} info="Choisissez d'abord l'indicatif (le pays du numéro), puis saisissez votre numéro. L'indicatif peut être différent de votre pays de résidence.">
            <PhoneField
              indicatif={f.indicatif_telephone ?? ""}
              numero={f.telephone ?? ""}
              onIndicatif={(i) => set("indicatif_telephone", i)}
              onNumero={(n) => set("telephone", n)}
            />
          </Field>
        </>
      )}

      {step === 1 && (
        <>
          <Field label="Pays" required highlight={hl("pays")} info="Votre pays de résidence. Utilisez la recherche pour le trouver rapidement.">
            <PaysSelect
              value={f.pays ?? ""}
              onChange={(nom) => {
                set("pays", nom);
                if (!f.indicatif_telephone) set("indicatif_telephone", indicatifDePays(nom));
              }}
            />
          </Field>
          <Field label="Région / État" highlight={hl("region")}><input style={inp("region")} value={f.region ?? ""} onChange={(e) => set("region", e.target.value)} placeholder="Ex. Île-de-France, Californie..." /></Field>
          <Field label="Ville" required highlight={hl("ville")}><input style={inp("ville")} value={f.ville} onChange={(e) => set("ville", e.target.value)} /></Field>
          <Field label="Commission" required highlight={hl("commission_id")}>
            <select style={inp("commission_id")} value={f.commission_id ?? ""} onChange={(e) => set("commission_id", e.target.value)}>
              <option value="">Sélectionner...</option>
              {commissions.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </Field>
          <Field label="Groupe" highlight={hl("groupe")}>
            <select style={inp("groupe")} value={f.groupe ?? ""} onChange={(e) => set("groupe", e.target.value)}>
              <option value="">Sélectionner...</option>
              {groupes.map((g) => <option key={g.id} value={g.nom}>{g.nom}</option>)}
            </select>
          </Field>
          <Field label="Intendance" highlight={hl("intendance_id")}>
            <select style={inp("intendance_id")} value={f.intendance_id ?? ""} onChange={(e) => set("intendance_id", e.target.value)}>
              <option value="">Sélectionner...</option>
              {intendances.map((i) => <option key={i.id} value={i.id}>{i.nom}</option>)}
            </select>
          </Field>
          <Field label="Tribu" required highlight={hl("tribu_id")}>
            <select style={inp("tribu_id")} value={f.tribu_id ?? ""} onChange={(e) => set("tribu_id", e.target.value)}>
              <option value="">Sélectionner...</option>
              {tribus.map((tr) => <option key={tr.id} value={tr.id}>{tr.nom}</option>)}
            </select>
          </Field>
        </>
      )}

      {step === 2 && (
        <>
          <p style={{ fontFamily: T.fm, fontSize: 9, letterSpacing: 0.8, color: T.b600, margin: "14px 2px 2px" }}>ENGAGEMENT & FONCTION</p>
          <Field label={t("profil.statut")} highlight={hl("type_membre")} info={t("profil.statutInfo")}>
            <select style={inp("type_membre")} value={f.type_membre ?? ""} onChange={(e) => set("type_membre", e.target.value)}>
              <option value="">Sélectionner...</option>
              {STATUTS.map((s) => <option key={s.value} value={s.value}>{t(s.key)}</option>)}
            </select>
          </Field>
          <Field label={t("profil.fonction")} highlight={hl("fonction_cle")} info={t("profil.fonctionInfo")}>
            <select style={inp("fonction_cle")} value={f.fonction_cle ?? ""} onChange={(e) => set("fonction_cle", e.target.value)}>
              <option value="">{t("profil.fonctionAucune")}</option>
              {fonctions.map((fn) => <option key={fn.cle} value={fn.cle}>{fn.libelle_h || fn.libelle_n}</option>)}
            </select>
          </Field>
          {profile?.fonction_cle && !profile.fonction_confirmee && (
            <p style={{ fontSize: 11, color: T.warn, margin: "6px 2px 0" }}>{t("profil.fonctionAttente")}</p>
          )}

          <p style={{ fontFamily: T.fm, fontSize: 9, letterSpacing: 0.8, color: T.b600, margin: "18px 2px 2px" }}>ADRESSE (facultatif)</p>
          <p style={{ fontSize: 11, color: T.mut, lineHeight: 1.5, margin: "2px 2px 6px" }}>
            Une indication générale suffit (quartier, secteur). Ne renseignez pas d'adresse précise.
          </p>
          <Field label="Adresse (générale)" highlight={hl("adresse")} info="Une indication générale suffit (quartier, secteur). Ne renseignez jamais une adresse précise, pour votre sécurité."><input style={inp("adresse")} value={f.adresse ?? ""} onChange={(e) => set("adresse", e.target.value)} placeholder="Ex. Cocody, quartier des Deux-Plateaux" /></Field>
          <Field label="Complément (facultatif)" highlight={hl("adresse_complement")}><input style={inp("adresse_complement")} value={f.adresse_complement ?? ""} onChange={(e) => set("adresse_complement", e.target.value)} placeholder="Précision libre, si vous le souhaitez" /></Field>

          <p style={{ fontFamily: T.fm, fontSize: 9, letterSpacing: 0.8, color: T.b600, margin: "18px 2px 2px" }}>VIE PERSONNELLE (facultatif)</p>
          <Field label="Situation matrimoniale" highlight={hl("situation_matrimoniale")}>
            <select style={inp("situation_matrimoniale")} value={f.situation_matrimoniale ?? ""} onChange={(e) => set("situation_matrimoniale", e.target.value)}>
              <option value="">Sélectionner...</option>
              {SITUATIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Profession" highlight={hl("profession")}><input style={inp("profession")} value={f.profession} onChange={(e) => set("profession", e.target.value)} /></Field>
          <Field label="Niveau d'études" highlight={hl("niveau_etudes")}><input style={inp("niveau_etudes")} value={f.niveau_etudes} onChange={(e) => set("niveau_etudes", e.target.value)} /></Field>
        </>
      )}

      {step === 3 && (
        <PiecesJustificatives
          photoProvided={photoProvided}
          pieceProvided={pieceProvided}
          photoHighlight={hl("photo")}
          pieceHighlight={hl("piece")}
          photoFile={photoFile}
          pieceFile={pieceFile}
          pieceType={pieceType}
          onPhotoFile={setPhotoFile}
          onPieceFile={setPieceFile}
          onPieceType={setPieceType}
        />
      )}

      {step === 4 && (
        <>
          <p style={{ fontSize: 12, color: T.mut, lineHeight: 1.5, margin: "10px 2px 8px" }}>
            Lisez les documents puis signez électroniquement avec le code reçu. Cette signature valide votre engagement.
          </p>
          <SignatureEngagement token={token} onSigned={() => setSigned(true)} />
        </>
      )}

      {step === 5 && (
        <>
          <p style={{ fontSize: 12, color: T.mut, lineHeight: 1.5, margin: "10px 2px 8px" }}>
            Vérifiez le récapitulatif. Vous pouvez revenir en arrière pour corriger avant d'envoyer.
          </p>
          <RecapRow label="Nom complet" value={`${f.prenoms} ${f.nom}`.trim() || "Non renseigné"} ok={!!(f.prenoms && f.nom)} />
          <RecapRow label="Téléphone" value={f.telephone ? `${f.indicatif_telephone ?? ""} ${f.telephone}` : "Non renseigné"} ok={!!f.telephone} />
          <RecapRow label="Pays / Ville" value={[f.pays, f.ville].filter(Boolean).join(", ") || "Non renseigné"} ok={!!(f.pays && f.ville)} />
          <RecapRow label="Commission" value={commissionNom || "Non choisie"} ok={!!f.commission_id} />
          <RecapRow label="Tribu" value={tribuNom || "Non choisie"} ok={!!f.tribu_id} />
          <RecapRow label="Photo d'identité" value={photoOk ? "Fournie" : "Manquante"} ok={photoOk} />
          <RecapRow label="Pièce d'identité" value={pieceOk ? "Fournie" : "Manquante"} ok={pieceOk} />
          <RecapRow label="Signature électronique" value={signed ? "Vérifiée" : "Manquante"} ok={signed} />
        </>
      )}

      {error && <p style={{ color: T.dng, fontSize: 12.5, marginTop: 10 }}>{error}</p>}

      {step < 5 ? (
        <WizardNav step={step} onBack={() => goTo(step - 1)} onNext={goNext} />
      ) : (
        (() => {
          const submitDisabled = busy || !requiredOk || !photoOk || !pieceOk || photoNeedsRedo || pieceNeedsRedo || !signed;
          return (
            <div style={{ position: "sticky", bottom: 0, marginTop: 16, padding: "10px 0 6px", background: `linear-gradient(transparent, ${T.bg} 35%)`, display: "flex", gap: 10 }}>
              <div onClick={() => goTo(4)} className="tap" style={{ flex: 1, height: 50, border: `1.5px solid ${T.line}`, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14, background: T.surf }}>
                Retour
              </div>
              <div
                onClick={submitDisabled ? undefined : () => void submit()}
                className="tap"
                style={{ flex: 2, height: 50, background: submitDisabled ? T.faint : gradient, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 15, opacity: submitDisabled ? 0.7 : 1, cursor: submitDisabled ? "not-allowed" : "pointer", boxShadow: submitDisabled ? "none" : "0 12px 24px -10px rgba(42,79,173,.7)" }}
              >
                {busy ? "Envoi en cours..." : correction ? t("correction.resubmit") : "Soumettre mon inscription"}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
