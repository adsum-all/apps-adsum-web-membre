import { useState } from "react";

import { type MembreProfile, type ProfilFields, telegramLien } from "../api.js";
import { useT } from "../i18n.js";
import { T } from "../proto.js";
import { InfoTip } from "./InfoTip.js";

export const lbl = { fontFamily: T.fm, fontSize: 9, color: T.mut, margin: "12px 0 5px", display: "block" } as const;
export const baseInp = { width: "100%", border: `1px solid ${T.line}`, borderRadius: 11, padding: "11px 12px", fontSize: 13.5, fontFamily: T.fu, background: T.surf, boxSizing: "border-box" } as const;

export const GENRES = [
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
];
export const SITUATIONS = [
  { value: "celibataire", label: "Célibataire" },
  { value: "en_couple", label: "En couple" },
  { value: "fiance", label: "Fiancé(e)" },
  { value: "marie", label: "Marié(e)" },
  { value: "veuf", label: "Veuf(ve)" },
  { value: "divorce", label: "Divorcé(e)" },
];
export const STATUTS = [
  { value: "membre_simple", key: "profil.statutSimple" },
  { value: "membre_actif", key: "profil.statutActif" },
  { value: "nouveau_engage", key: "profil.statutNouveau" },
  { value: "inspirant", key: "profil.statutInspirant" },
];
export const DOC_TYPES = ["piece_identite", "passeport", "permis", "carte_consulaire"];

/** Build the initial form state from the loaded profile so nothing is ever lost. */
export function initialFields(p: MembreProfile | null): ProfilFields {
  return {
    prenoms: p?.prenoms ?? "",
    nom: p?.nom ?? "",
    telephone: p?.telephone ?? "",
    indicatif_telephone: p?.indicatif_telephone ?? "",
    date_naissance: p?.date_naissance ?? "",
    naissance_annee_visible: p?.naissance_annee_visible ?? false,
    genre: p?.genre ?? "",
    pays: p?.pays ?? "",
    region: p?.region ?? "",
    ville: p?.ville ?? "",
    adresse: p?.adresse ?? "",
    adresse_complement: p?.adresse_complement ?? "",
    commission_id: p?.commission_id ?? "",
    intendance_id: p?.intendance_id ?? "",
    tribu_id: p?.tribu_id ?? "",
    groupe: p?.groupe ?? "",
    situation_matrimoniale: p?.situation_matrimoniale ?? "",
    profession: p?.profession ?? "",
    niveau_etudes: p?.niveau_etudes ?? "",
    type_membre: p?.type_membre ?? "",
    fonction_cle: p?.fonction_cle ?? "",
  };
}

/** A labelled form row. When highlight is set, a "to fix" tag is shown. */
export function Field({ label, required, info, highlight, children }: { label: string; required?: boolean; info?: string; highlight?: boolean; children: React.ReactNode }): JSX.Element {
  const t = useT();
  return (
    <div>
      <span style={lbl}>
        {label.toUpperCase()} {required && <span style={{ color: T.dng }}>*</span>}
        {info && <InfoTip text={info} />}
        {highlight && (
          <span style={{ marginLeft: 6, fontSize: 8.5, fontWeight: 700, color: T.warn, background: T.warnbg, borderRadius: 6, padding: "2px 6px" }}>
            {t("correction.fieldTag").toUpperCase()}
          </span>
        )}
      </span>
      {children}
    </div>
  );
}

/** Step definitions of the registration wizard, in order. */
export const WIZARD_STEPS = [
  { key: "identite", label: "Identité" },
  { key: "rattachement", label: "Rattachement" },
  { key: "vie", label: "Vie & fonction" },
  { key: "pieces", label: "Pièces" },
  { key: "signature", label: "Signature" },
  { key: "recap", label: "Récapitulatif" },
] as const;

/** Progress header of the wizard: step counter, title and progress bar. */
export function Stepper({ step }: { step: number }): JSX.Element {
  const total = WIZARD_STEPS.length;
  return (
    <div style={{ margin: "10px 0 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 16 }}>{WIZARD_STEPS[step]?.label ?? ""}</span>
        <span style={{ fontFamily: T.fm, fontSize: 10, color: T.mut }}>Étape {step + 1} / {total}</span>
      </div>
      <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
        {WIZARD_STEPS.map((s, i) => (
          <div key={s.key} style={{ flex: 1, height: 4, borderRadius: 3, background: i <= step ? T.b600 : T.line, transition: "background 200ms ease" }} />
        ))}
      </div>
    </div>
  );
}

/** Sticky back / continue bar, always reachable at the bottom of the step. */
export function WizardNav({ step, busy, nextLabel, onBack, onNext }: {
  step: number;
  busy?: boolean;
  nextLabel?: string;
  onBack: () => void;
  onNext: () => void;
}): JSX.Element {
  return (
    <div style={{ position: "sticky", bottom: 0, marginTop: 16, padding: "10px 0 6px", background: `linear-gradient(transparent, ${T.bg} 35%)`, display: "flex", gap: 10 }}>
      {step > 0 && (
        <div onClick={onBack} className="tap" style={{ flex: 1, height: 48, border: `1.5px solid ${T.line}`, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14, background: T.surf }}>
          Retour
        </div>
      )}
      <div
        onClick={busy ? undefined : onNext}
        className="tap"
        style={{ flex: 2, height: 48, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14.5, background: busy ? T.faint : T.b600, opacity: busy ? 0.7 : 1, boxShadow: busy ? "none" : "0 10px 20px -10px rgba(42,79,173,.6)" }}
      >
        {nextLabel ?? "Continuer"}
      </div>
    </div>
  );
}

/** Read-only summary row of the final recap step. */
export function RecapRow({ label, value, ok }: { label: string; value: string; ok?: boolean }): JSX.Element {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 2px", borderBottom: `1px solid ${T.line}` }}>
      <span style={{ fontSize: 12, color: T.mut }}>{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, textAlign: "right", color: ok === false ? T.warn : T.ink }}>{value}</span>
    </div>
  );
}

export function TelegramInvite({ token }: { token: string }): JSX.Element {
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
