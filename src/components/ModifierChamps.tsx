import { useState } from "react";

import { type MembreProfile, type ProfilFields, updateProfil } from "../api.js";
import { T } from "../proto.js";

/** Human label for each unlockable member field. */
const LABELS: Record<string, string> = {
  nom: "Nom",
  prenoms: "Prénoms",
  telephone: "Téléphone",
  date_naissance: "Date de naissance",
  genre: "Genre",
  pays: "Pays",
  ville: "Ville",
  profession: "Profession",
  niveau_etudes: "Niveau d'études",
  situation_matrimoniale: "Situation matrimoniale",
};

const SITUATIONS = ["celibataire", "en_couple", "fiance", "marie", "veuf", "divorce"];
const GENRES = ["homme", "femme"];

function initialValue(field: string, profile: MembreProfile): string {
  const v = (profile as unknown as Record<string, unknown>)[field];
  return v == null ? "" : String(v);
}

interface ModifierChampsProps {
  token: string;
  profile: MembreProfile;
  onSubmitted: () => void;
}

/**
 * Member-facing editor for the fields the administration has unlocked.
 * Submitting does not change the record directly: it files a proposal that the
 * administration validates before it is committed (bank / public-service style).
 */
export function ModifierChamps({ token, profile, onSubmitted }: ModifierChampsProps): JSX.Element | null {
  const unlocked = (profile.champs_deverrouilles ?? []).filter((f) => f in LABELS);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(unlocked.map((f) => [f, initialValue(f, profile)])),
  );
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (unlocked.length === 0) return null;

  async function submit(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const payload: ProfilFields = {};
      for (const f of unlocked) {
        (payload as Record<string, string>)[f] = values[f] ?? "";
      }
      const res = await updateProfil(token, payload);
      if (res.pending_validation) {
        setDone(true);
        onSubmitted();
      }
    } catch {
      setError("Envoi impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div style={{ background: T.warnbg, border: `1px solid ${T.warn}33`, borderRadius: 14, padding: "14px 16px", margin: "12px 0" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.warn, margin: 0 }}>Modification en attente de validation</p>
        <p style={{ fontSize: 12, color: T.mut, margin: "6px 0 0", lineHeight: 1.5 }}>
          Votre proposition a été transmise à l'administration. Elle sera enregistrée après validation finale.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 14, padding: "14px 16px", margin: "12px 0" }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: T.ink, margin: "0 0 4px", fontFamily: T.fd }}>
        Champs débloqués par l'administration
      </p>
      <p style={{ fontSize: 11.5, color: T.mut, margin: "0 0 12px", lineHeight: 1.5 }}>
        Corrigez les informations ci-dessous puis soumettez. La modification sera enregistrée après validation finale.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {unlocked.map((f) => (
          <label key={f} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: T.mut }}>{LABELS[f]}</span>
            <Field
              field={f}
              value={values[f] ?? ""}
              onChange={(val) => setValues((prev) => ({ ...prev, [f]: val }))}
            />
          </label>
        ))}
      </div>
      {error && <p style={{ fontSize: 12, color: T.dng, margin: "10px 0 0" }}>{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="tap"
        style={{
          marginTop: 14,
          width: "100%",
          height: 46,
          background: `linear-gradient(180deg,${T.b500},${T.b600})`,
          borderRadius: 12,
          border: "none",
          color: "#fff",
          fontWeight: 600,
          fontSize: 14,
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Envoi..." : "Soumettre pour validation"}
      </button>
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  height: 42,
  border: `1px solid ${T.line}`,
  borderRadius: 10,
  padding: "0 12px",
  fontSize: 13.5,
  color: T.ink,
  background: "#fff",
  width: "100%",
};

function Field({ field, value, onChange }: { field: string; value: string; onChange: (v: string) => void }): JSX.Element {
  if (field === "situation_matrimoniale") {
    return (
      <select style={INPUT_STYLE} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Sélectionner...</option>
        {SITUATIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    );
  }
  if (field === "genre") {
    return (
      <select style={INPUT_STYLE} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Sélectionner...</option>
        {GENRES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      style={INPUT_STYLE}
      type={field === "date_naissance" ? "date" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
