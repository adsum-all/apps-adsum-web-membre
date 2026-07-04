import { useRef, useState } from "react";

import { type MembreProfile, soumettreModifications, uploadPhoto } from "../api.js";
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
 * Single, unified editor for everything the administration unlocked in the
 * current cycle: the text fields AND the identity photo, submitted ONCE.
 * Selecting a photo only stages it (no submission); the record is never changed
 * directly. The one "Soumettre pour validation" click files the whole proposal,
 * the server consumes the unlock, and this panel disappears (its visibility is
 * driven by the server truth champs_deverrouilles, so a refresh cannot reopen
 * it). A new modification requires the administration to unlock again.
 */
export function ModifierChamps({ token, profile, onSubmitted }: ModifierChampsProps): JSX.Element | null {
  const deverrouilles = profile.champs_deverrouilles ?? [];
  const unlocked = deverrouilles.filter((f) => f in LABELS);
  const photoUnlocked = deverrouilles.includes("photo_identite");

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(unlocked.map((f) => [f, initialValue(f, profile)])),
  );
  const photoInput = useRef<HTMLInputElement | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoStaged, setPhotoStaged] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (unlocked.length === 0 && !photoUnlocked) return null;

  async function stagePhoto(file: File): Promise<void> {
    setPhotoBusy(true);
    setError(null);
    try {
      // Uploads and stages only: the live photo is untouched until the
      // administration validates the single submission below.
      await uploadPhoto(token, file);
      setPhotoStaged(true);
      setPhotoPreview(URL.createObjectURL(file));
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Chargement de la photo impossible. Réessayez.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function submit(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const champs: Record<string, string> = {};
      for (const f of unlocked) champs[f] = values[f] ?? "";
      const res = await soumettreModifications(token, champs, photoStaged);
      if (res.pending_validation) {
        setDone(true);
        onSubmitted();
      }
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Envoi impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div style={{ background: T.warnbg, border: `1px solid ${T.warn}33`, borderRadius: 14, padding: "14px 16px", margin: "12px 0" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.warn, margin: 0 }}>Modification en attente de validation</p>
        <p style={{ fontSize: 12, color: T.mut, margin: "6px 0 0", lineHeight: 1.5 }}>
          Votre proposition (informations{photoStaged ? " et photo" : ""}) a été transmise à l'administration. Elle sera
          enregistrée après validation finale. Vous ne pouvez plus la modifier tant que l'administration n'a pas rouvert
          un nouveau déblocage.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 14, padding: "14px 16px", margin: "12px 0" }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: T.ink, margin: "0 0 4px", fontFamily: T.fd }}>
        Correction débloquée par l'administration
      </p>
      <p style={{ fontSize: 11.5, color: T.mut, margin: "0 0 12px", lineHeight: 1.5 }}>
        Modifiez les éléments ci-dessous puis soumettez une seule fois. Tout est envoyé ensemble et sera enregistré
        après validation finale.
      </p>

      {photoUnlocked && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: unlocked.length ? 14 : 4 }}>
          {photoPreview ? (
            <img src={photoPreview} alt="Nouvelle photo" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", objectPosition: "50% 30%", border: `2px solid ${T.b500}` }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#eef2ff", color: T.b600, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              {"📷"}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              ref={photoInput}
              type="file"
              accept="image/jpeg,image/png"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void stagePhoto(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={photoBusy || busy}
              onClick={() => photoInput.current?.click()}
              className="tap"
              style={{ height: 38, padding: "0 14px", borderRadius: 10, background: photoStaged ? T.ok : T.b600, color: "#fff", border: "none", fontWeight: 600, fontSize: 12.5, opacity: photoBusy ? 0.6 : 1 }}
            >
              {photoBusy ? "Chargement..." : photoStaged ? "Photo prête, changer" : "Choisir ma nouvelle photo"}
            </button>
            <p style={{ fontSize: 11, color: T.mut, margin: "6px 0 0", lineHeight: 1.4 }}>
              {photoStaged
                ? "Photo prête. Elle sera enregistrée à la validation, avec le reste."
                : "La photo n'est pas encore envoyée : elle partira avec la soumission unique."}
            </p>
          </div>
        </div>
      )}

      {unlocked.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {unlocked.map((f) => (
            <label key={f} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: T.mut }}>{LABELS[f]}</span>
              <Field field={f} value={values[f] ?? ""} onChange={(val) => setValues((prev) => ({ ...prev, [f]: val }))} />
            </label>
          ))}
        </div>
      )}

      {error && <p style={{ fontSize: 12, color: T.dng, margin: "10px 0 0" }}>{error}</p>}
      <button
        type="button"
        disabled={busy || photoBusy}
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
          opacity: busy || photoBusy ? 0.6 : 1,
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
