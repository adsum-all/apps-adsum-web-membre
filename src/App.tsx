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
      <button type="button" className="btn btn-ghost" onClick={onRecensement}>
        Recensement annuel
      </button>
    </div>
  );
}
