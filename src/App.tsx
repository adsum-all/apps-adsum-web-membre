import { useCallback, useState } from "react";

import { type MembreProfile, getMembreProfile } from "./api.js";
import { Activites } from "./components/Activites.js";
import { Carte } from "./components/Carte.js";
import { Historique } from "./components/Historique.js";
import { Login } from "./components/Login.js";
import { Notifications } from "./components/Notifications.js";
import { Recensement } from "./components/Recensement.js";
import { TabBar, type TabId } from "./components/TabBar.js";

export function App(): JSX.Element {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<MembreProfile | null>(null);
  const [tab, setTab] = useState<TabId>("carte");
  const [notifOpen, setNotifOpen] = useState(false);
  const [recensementOpen, setRecensementOpen] = useState(false);

  const onAuth = useCallback(async (jwt: string) => {
    setProfile(await getMembreProfile(jwt));
    setToken(jwt);
  }, []);

  if (!token) {
    return (
      <Shell>
        <Login onAuth={onAuth} />
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="topbar">
        <span className="topbar-title">
          {recensementOpen ? "Recensement" : notifOpen ? "Notifications" : tabTitle(tab)}
        </span>
        {recensementOpen ? (
          <button type="button" className="bell" onClick={() => setRecensementOpen(false)}>
            Fermer
          </button>
        ) : (
          <button
            type="button"
            className="bell"
            aria-label={notifOpen ? "Fermer les notifications" : "Notifications"}
            onClick={() => setNotifOpen((v) => !v)}
          >
            {notifOpen ? "Fermer" : "◉"}
          </button>
        )}
      </header>
      <main className="screen">
        {recensementOpen ? (
          <Recensement token={token} />
        ) : notifOpen ? (
          <Notifications token={token} />
        ) : (
          <>
            {tab === "carte" && <Carte token={token} profile={profile} />}
            {tab === "activites" && <Activites token={token} />}
            {tab === "historique" && <Historique token={token} />}
            {tab === "profil" && <Profil profile={profile} onRecensement={() => setRecensementOpen(true)} />}
          </>
        )}
      </main>
      <TabBar
        active={tab}
        onChange={(t) => {
          setNotifOpen(false);
          setRecensementOpen(false);
          setTab(t);
        }}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="phone">
      <div className="phone-inner">{children}</div>
    </div>
  );
}

function tabTitle(tab: TabId): string {
  return { carte: "Ma carte", activites: "Activites", historique: "Historique", profil: "Profil" }[tab];
}

const ENGAGEMENT_LABELS: Record<string, string> = {
  membre_simple: "Membre simple",
  nouveau_engage: "Nouvel engage",
  aspirant: "Aspirant",
  engage: "Engage",
  berger: "Berger",
  responsable: "Responsable",
};

const MATRIMONIAL_LABELS: Record<string, string> = {
  celibataire: "Celibataire",
  en_couple: "En couple",
  marie: "Marie(e)",
};

function pretty(value: string | null | undefined): string {
  if (!value) return "-";
  const mapped = value.replace(/_/g, " ");
  return mapped.charAt(0).toUpperCase() + mapped.slice(1);
}

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <li>
      <span>{label}</span>
      <strong>{value}</strong>
    </li>
  );
}

function Profil({
  profile,
  onRecensement,
}: {
  profile: MembreProfile | null;
  onRecensement: () => void;
}): JSX.Element {
  const fullName =
    profile && (profile.prenoms || profile.nom)
      ? `${profile.prenoms ?? ""} ${profile.nom ?? ""}`.trim()
      : (profile?.email ?? "Membre ADSUM");
  const initials = fullName.slice(0, 2).toUpperCase();
  const engagement = profile?.type_membre ? (ENGAGEMENT_LABELS[profile.type_membre] ?? pretty(profile.type_membre)) : "-";
  const matrimonial = profile?.situation_matrimoniale
    ? (MATRIMONIAL_LABELS[profile.situation_matrimoniale] ?? pretty(profile.situation_matrimoniale))
    : "-";
  const marriage = profile?.type_mariage ? ` (${pretty(profile.type_mariage)})` : "";

  return (
    <div className="profil">
      <div className="profil-head">
        <div className="avatar" aria-hidden="true">
          {initials}
        </div>
        <h2>{fullName}</h2>
        <p className="profil-role">{profile?.matricule ?? ""}</p>
      </div>

      <p className="section-title profil-group">Identite ecclesiale</p>
      <ul className="profil-list">
        <Row label="Tribu" value={profile?.tribu ?? "-"} />
        <Row label="Patriarche" value={profile?.patriarche ?? "-"} />
        <Row label="Niveau d'engagement" value={engagement} />
        <Row label="Promotion" value={profile?.promotion ?? "-"} />
        <Row label="Cheminement" value={pretty(profile?.cheminement_pastoral)} />
      </ul>

      <p className="section-title profil-group">Organisation</p>
      <ul className="profil-list">
        <Row label="Commission" value={profile?.commission ?? "-"} />
        <Row label="Intendance" value={profile?.intendance ?? "-"} />
        <Row label="Coordination" value={profile?.coordination ?? "-"} />
        <Row label="Coordinateur" value={profile?.coordinateur ?? "-"} />
      </ul>

      <p className="section-title profil-group">Vie personnelle</p>
      <ul className="profil-list">
        <Row label="Situation" value={matrimonial + marriage} />
        <Row label="Profession" value={profile?.profession ?? "-"} />
        <Row label="Niveau d'etudes" value={profile?.niveau_etudes ?? "-"} />
        <Row label="Ville" value={profile?.ville ?? "-"} />
      </ul>

      <p className="section-title profil-group">Sacrements</p>
      <div className="sacrement-row">
        <span className={`chip ${profile?.baptise ? "" : "chip-off"}`}>Baptise</span>
        <span className={`chip ${profile?.confirme ? "" : "chip-off"}`}>Confirme</span>
        <span className={`chip ${profile?.premiere_communion ? "" : "chip-off"}`}>1re communion</span>
      </div>

      <p className="section-title profil-group">Compte</p>
      <ul className="profil-list">
        <Row label="Identite" value={profile?.verifie ? "Verifiee" : "En attente"} />
        <Row label="Statut" value={pretty(profile?.statut)} />
        <Row label="Courriel" value={profile?.email ?? "-"} />
        <Row label="Telephone" value={profile?.telephone ?? "-"} />
      </ul>

      <button type="button" className="btn btn-ghost btn-block" onClick={onRecensement}>
        Recensement annuel
      </button>
    </div>
  );
}
