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
