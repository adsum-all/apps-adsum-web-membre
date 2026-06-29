import { useCallback, useState } from "react";

import { type MembreProfile, getMembreProfile } from "./api.js";
import { Activites } from "./components/Activites.js";
import { Carte } from "./components/Carte.js";
import { Historique } from "./components/Historique.js";
import { Login } from "./components/Login.js";
import { Notifications } from "./components/Notifications.js";
import { TabBar, type TabId } from "./components/TabBar.js";

export function App(): JSX.Element {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<MembreProfile | null>(null);
  const [tab, setTab] = useState<TabId>("carte");
  const [notifOpen, setNotifOpen] = useState(false);

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
        <span className="topbar-title">{notifOpen ? "Notifications" : tabTitle(tab)}</span>
        <button
          type="button"
          className="bell"
          aria-label={notifOpen ? "Fermer les notifications" : "Notifications"}
          onClick={() => setNotifOpen((v) => !v)}
        >
          {notifOpen ? "Fermer" : "◉"}
        </button>
      </header>
      <main className="screen">
        {notifOpen ? (
          <Notifications token={token} />
        ) : (
          <>
            {tab === "carte" && <Carte token={token} profile={profile} />}
            {tab === "activites" && <Activites token={token} />}
            {tab === "historique" && <Historique token={token} />}
            {tab === "profil" && <Profil profile={profile} />}
          </>
        )}
      </main>
      <TabBar
        active={tab}
        onChange={(t) => {
          setNotifOpen(false);
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

function Profil({ profile }: { profile: MembreProfile | null }): JSX.Element {
  const fullName =
    profile && (profile.prenoms || profile.nom)
      ? `${profile.prenoms ?? ""} ${profile.nom ?? ""}`.trim()
      : (profile?.email ?? "Membre ADSUM");
  const initials = fullName.slice(0, 2).toUpperCase();

  return (
    <div className="profil">
      <div className="avatar" aria-hidden="true">{initials}</div>
      <h2>{fullName}</h2>
      <p className="profil-role">{profile ? profile.matricule : ""}</p>
      <ul className="profil-list">
        <li>
          <span>Commission</span>
          <strong>{profile?.commission ?? "-"}</strong>
        </li>
        <li>
          <span>Statut</span>
          <strong>{profile?.statut ?? "-"}</strong>
        </li>
        <li>
          <span>Identite</span>
          <strong>{profile?.verifie ? "Verifiee" : "En attente"}</strong>
        </li>
        <li>
          <span>Courriel</span>
          <strong>{profile?.email ?? "-"}</strong>
        </li>
      </ul>
    </div>
  );
}
