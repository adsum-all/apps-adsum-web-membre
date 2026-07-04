import { useEffect, useState } from "react";

import { type MembreProfile, getDemandes, getPhotoUrl, photoObjectPosition, setPhotoFocus } from "../api.js";
import { type Focus, PhotoFocusEditor } from "./PhotoFocusEditor.js";
import { civilName, civilNameComplet } from "../name.js";
import { T } from "../proto.js";
import { ModifierChamps } from "./ModifierChamps.js";

/** Member-facing labels of the unlockable elements (mirror of the server
 * catalog): fields, identity photo and official identity document. */
const ELEMENT_LABELS: Record<string, string> = {
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
  photo_identite: "Photo d'identité",
  piece_identite: "Pièce d'identité officielle",
};

const ENGAGEMENT: Record<string, string> = {
  membre_simple: "Membre simple",
  nouveau_engage: "Nouvel engagé",
  aspirant: "Aspirant",
  engage: "Engagé",
  berger: "Berger",
  responsable: "Responsable",
};
const MATRIMONIAL: Record<string, string> = {
  celibataire: "Célibataire",
  en_couple: "En couple",
  marie: "Marié(e)",
  fiance: "Fiancé(e)",
  veuf: "Veuf(ve)",
  divorce: "Divorcé(e)",
};

function pretty(v: string | null | undefined): string {
  if (!v) return "-";
  const s = v.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** Birth date honouring the year-visibility choice: full date if allowed,
 * otherwise only the day and month (the birthday). */
function naissance(date: string | null | undefined, anneeVisible: boolean): string {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  const jour = d.getUTCDate();
  const mois = MOIS[d.getUTCMonth()] ?? "";
  return anneeVisible ? `${jour} ${mois} ${d.getUTCFullYear()}` : `${jour} ${mois}`;
}

function telephone(indicatif: string | null | undefined, numero: string | null | undefined): string {
  const n = numero?.trim();
  if (!n) return "-";
  return indicatif ? `${indicatif} ${n}` : n;
}

function fullName(profile: MembreProfile | null): string {
  // Header: capped civil name (family name first), never a function.
  return (profile ? civilName(profile) : "") || "-";
}

function fullNameComplet(profile: MembreProfile | null): string {
  // Detailed file: full civil name (family name + all given names).
  return (profile ? civilNameComplet(profile) : "") || "-";
}

function Group({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <>
      <p style={{ fontFamily: T.fm, fontSize: 9, letterSpacing: 0.8, color: T.mut, margin: "16px 2px 7px" }}>{title.toUpperCase()}</p>
      <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 14, overflow: "hidden" }}>{children}</div>
    </>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }): JSX.Element {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderBottom: last ? "none" : `1px solid ${T.line}` }}>
      <span style={{ fontSize: 12.5, color: T.mut }}>{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, textAlign: "right", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

export function Infos({
  token,
  profile,
  onDemande,
  onProfileChange,
}: {
  token: string | null;
  profile: MembreProfile | null;
  onDemande: () => void;
  onProfileChange: () => void;
}): JSX.Element {
  const deverrouilles = profile?.champs_deverrouilles ?? [];
  const unlocked = deverrouilles.length > 0;
  const pieceDebloquee = deverrouilles.includes("piece_identite");

  // Identity photo shown at the top of "Mes informations" (signed short-lived
  // URL, initials fallback when the member has no photo yet).
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!token) return undefined;
    let alive = true;
    getPhotoUrl(token)
      .then((r) => {
        if (alive) setPhotoUrl(r.url);
      })
      .catch(() => {
        if (alive) setPhotoUrl(null);
      });
    return () => {
      alive = false;
    };
  }, [token, profile?.photo_url]);

  // Re-frame the current photo (display-only focal point, no re-validation).
  const [cadrer, setCadrer] = useState(false);
  const [cadreBusy, setCadreBusy] = useState(false);
  async function enregistrerCadrage(focus: Focus): Promise<void> {
    if (!token) return;
    setCadreBusy(true);
    try {
      await setPhotoFocus(token, focus.x, focus.y);
      setCadrer(false);
      onProfileChange();
    } catch {
      setCadrer(false);
    } finally {
      setCadreBusy(false);
    }
  }

  // Deadline granted with the unlock: read from the member's own requests.
  const [echeance, setEcheance] = useState<string | null>(null);
  useEffect(() => {
    if (!token || !unlocked) {
      setEcheance(null);
      return;
    }
    getDemandes(token)
      .then((ds) => {
        const attente = ds.find((d) => d.statut === "attente_membre" && d.echeance_reponse);
        setEcheance(attente?.echeance_reponse ?? null);
      })
      .catch(() => setEcheance(null));
  }, [token, unlocked]);

  const initiales = `${(profile?.prenoms ?? " ")[0] ?? ""}${(profile?.nom ?? " ")[0] ?? ""}`.trim().toUpperCase() || "?";
  const engagement = profile?.type_membre ? (ENGAGEMENT[profile.type_membre] ?? pretty(profile.type_membre)) : "-";
  const matrimonial = profile?.situation_matrimoniale
    ? (MATRIMONIAL[profile.situation_matrimoniale] ?? pretty(profile.situation_matrimoniale))
    : "-";
  const marriage = profile?.type_mariage ? ` (${pretty(profile.type_mariage)})` : "";

  const adresse = [profile?.adresse, profile?.adresse_complement].filter(Boolean).join(", ");
  const localisation = [profile?.ville, profile?.region, profile?.pays].filter(Boolean).join(", ");

  return (
    <div className="scr" style={{ padding: "6px 18px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 2px 4px" }}>
        {photoUrl ? (
          <img src={photoUrl} alt="Photo d'identité" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", objectPosition: photoObjectPosition(profile), border: `2px solid ${T.line}` }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.b600, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20 }}>
            {initiales}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 16, color: T.ink }}>{fullName(profile)}</div>
          <div style={{ fontSize: 11.5, color: T.mut, fontFamily: T.fm }}>{profile?.matricule ?? ""}</div>
          {profile?.est_berger && profile?.nom_pastoral_affiche && (
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#a06a12", marginTop: 3 }}>{profile.nom_pastoral_affiche}</div>
          )}
          {(profile?.fonctions ?? []).map((f, i) => (
            <div key={i} style={{ fontSize: 11.5, color: T.b600, fontWeight: 600, marginTop: 2 }}>
              {f.libelle}
              {f.perimetre ? ` - ${f.perimetre}` : ""}
            </div>
          ))}
          {!(profile?.est_berger && profile?.nom_pastoral_affiche) && (profile?.fonctions ?? []).length === 0 && (
            <div style={{ fontSize: 11.5, color: T.mut, marginTop: 2 }}>Membre</div>
          )}
          {profile?.photo_pending && (
            <div style={{ fontSize: 10.5, color: T.warn, marginTop: 3, fontWeight: 600 }}>
              Nouvelle photo en attente de validation
            </div>
          )}
          {photoUrl && (
            <button
              type="button"
              onClick={() => setCadrer(true)}
              style={{ marginTop: 4, padding: 0, background: "none", border: "none", color: T.b600, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
            >
              Ajuster le cadrage
            </button>
          )}
        </div>
      </div>

      {cadrer && photoUrl && (
        <PhotoFocusEditor
          imageUrl={photoUrl}
          initialFocus={
            profile?.photo_focus_x != null && profile?.photo_focus_y != null
              ? { x: profile.photo_focus_x, y: profile.photo_focus_y }
              : null
          }
          busy={cadreBusy}
          onCancel={() => setCadrer(false)}
          onConfirm={(focus) => void enregistrerCadrage(focus)}
        />
      )}

      {unlocked && (
        <div style={{ background: T.warnbg, border: `1px solid ${T.warn}`, borderRadius: 13, padding: 13, margin: "10px 0 4px" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#8a5a12" }}>
            L'administration a débloqué pour vous : {deverrouilles.map((c) => ELEMENT_LABELS[c] ?? c).join(", ")}.
          </div>
          <div style={{ fontSize: 11.5, color: "#8a5a12", marginTop: 4, lineHeight: 1.5 }}>
            {echeance
              ? `À faire avant le ${new Date(echeance).toLocaleDateString("fr-FR")}, sinon la demande sera clôturée sans suite. `
              : ""}
            {deverrouilles.some((c) => ELEMENT_LABELS[c] && c !== "piece_identite")
              ? "Corrigez le tout dans le formulaire ci-dessous puis soumettez une seule fois. "
              : ""}
            {pieceDebloquee ? "Pour la pièce d'identité : joignez le nouveau document dans votre demande (trombone). " : ""}
          </div>
        </div>
      )}

      <Group title="Identité">
        <Row label="Nom complet" value={fullNameComplet(profile)} />
        {profile?.nom_naissance && <Row label="Nom de naissance" value={profile.nom_naissance} />}
        {profile?.nom_marital && <Row label="Nom marital" value={profile.nom_marital} />}
        {profile?.est_berger && profile?.nom_pastoral_affiche && (
          <Row label="Nom pastoral" value={profile.nom_pastoral_affiche} />
        )}
        {(profile?.fonctions ?? []).map((f, i) => (
          <Row key={i} label={i === 0 ? "Fonction" : ""} value={f.perimetre ? `${f.libelle} - ${f.perimetre}` : f.libelle} />
        ))}
        <Row label="Genre" value={pretty(profile?.genre)} />
        <Row label={profile?.naissance_annee_visible ? "Date de naissance" : "Anniversaire"} value={naissance(profile?.date_naissance, !!profile?.naissance_annee_visible)} />
        <Row label="Matricule" value={profile?.matricule ?? "-"} last />
      </Group>

      <Group title="Coordonnées">
        <Row label="Téléphone" value={telephone(profile?.indicatif_telephone, profile?.telephone)} />
        <Row label="Courriel" value={profile?.email ?? "-"} />
        <Row label="Localisation" value={localisation || "-"} />
        <Row label="Adresse" value={adresse || "-"} last />
      </Group>

      <Group title="Identité ecclésiale">
        <Row label="Tribu" value={profile?.tribu ?? "-"} />
        <Row label="Patriarche" value={profile?.patriarche ?? "-"} />
        <Row label="Niveau d'engagement" value={engagement} />
        <Row label="Promotion" value={profile?.promotion ?? "-"} />
        <Row label="Cheminement" value={pretty(profile?.cheminement_pastoral)} last />
      </Group>

      <Group title="Organisation">
        <Row label="Commission" value={profile?.commission ?? "-"} />
        <Row label="Intendance" value={profile?.intendance ?? "-"} />
        <Row label="Coordination" value={profile?.coordination ?? "-"} />
        <Row label="Coordinateur" value={profile?.coordinateur ?? "-"} last />
      </Group>

      <Group title="Vie personnelle">
        <Row label="Situation" value={matrimonial + marriage} />
        <Row label="Profession" value={profile?.profession ?? "-"} />
        <Row label="Niveau d'études" value={profile?.niveau_etudes ?? "-"} last />
      </Group>

      {unlocked && token && profile && (
        <ModifierChamps token={token} profile={profile} onSubmitted={onProfileChange} />
      )}

      <p style={{ fontSize: 11, color: T.mut, lineHeight: 1.5, margin: "14px 2px 10px" }}>
        Certains champs sont gérés par l'administration. Pour les corriger, envoyez une demande motivée avec justificatif :
        l'équipe débloque alors la modification.
      </p>
      <div
        onClick={onDemande}
        className="tap"
        style={{ height: 48, background: `linear-gradient(180deg,${T.b500},${T.b600})`, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14, boxShadow: "0 10px 22px -10px rgba(42,79,173,.7)" }}
      >
        Demander une modification
      </div>
    </div>
  );
}
