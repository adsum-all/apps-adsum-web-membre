import { type MembreProfile } from "../api.js";
import { T } from "../proto.js";

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

export function Infos({ profile, onDemande }: { profile: MembreProfile | null; onDemande: () => void }): JSX.Element {
  const engagement = profile?.type_membre ? (ENGAGEMENT[profile.type_membre] ?? pretty(profile.type_membre)) : "-";
  const matrimonial = profile?.situation_matrimoniale
    ? (MATRIMONIAL[profile.situation_matrimoniale] ?? pretty(profile.situation_matrimoniale))
    : "-";
  const marriage = profile?.type_mariage ? ` (${pretty(profile.type_mariage)})` : "";

  return (
    <div className="scr" style={{ padding: "6px 18px 24px" }}>
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
        <Row label="Niveau d'études" value={profile?.niveau_etudes ?? "-"} />
        <Row label="Ville" value={profile?.ville ?? "-"} last />
      </Group>

      <Group title="Contact">
        <Row label="Courriel" value={profile?.email ?? "-"} />
        <Row label="Téléphone" value={profile?.telephone ?? "-"} last />
      </Group>

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
