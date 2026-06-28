import { useCallback, useState } from "react";

import { apiBaseUrl, getMe, type Me } from "./api.js";
import { Login } from "./components/Login.js";
import { QrCard } from "./components/QrCard.js";
import { TabBar, type TabId } from "./components/TabBar.js";

type Mode = "login" | "preview" | "app";

export function App(): JSX.Element {
  const [mode, setMode] = useState<Mode>("login");
  const [me, setMe] = useState<Me | null>(null);
  const [tab, setTab] = useState<TabId>("carte");

  const onAuth = useCallback(async (token: string) => {
    const profile = await getMe(token);
    setMe(profile);
    setMode("app");
  }, []);

  if (mode === "login") {
    return (
      <Shell>
        <Login onAuth={onAuth} onPreview={() => setMode("preview")} />
      </Shell>
    );
  }

  const preview = mode === "preview";
  const membreId = me?.membre_id ?? crypto.randomUUID();

  return (
    <Shell>
      <header className="topbar">
        <span className="topbar-title">{tab === "carte" ? "Ma carte" : tabTitle(tab)}</span>
        {preview && <span className="pill">apercu</span>}
      </header>
      <main className="screen">
        {tab === "carte" && (
          <QrCard matricule="ADS-000001" membreId={membreId} verifie={true} preview={preview} />
        )}
        {tab === "activites" && <Empty title="Activites" note="Vos activites et sessions en ligne s'afficheront ici, depuis l'API." />}
        {tab === "historique" && <Empty title="Historique" note="Votre historique de presence, en lecture seule et trace a l'audit." />}
        {tab === "profil" && <Profil me={me} preview={preview} />}
      </main>
      <TabBar active={tab} onChange={setTab} />
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

function Empty({ title, note }: { title: string; note: string }): JSX.Element {
  return (
    <div className="empty">
      <div className="empty-glyph" aria-hidden="true">◌</div>
      <h2>{title}</h2>
      <p>{note}</p>
    </div>
  );
}

function Profil({ me, preview }: { me: Me | null; preview: boolean }): JSX.Element {
  return (
    <div className="profil">
      <div className="avatar" aria-hidden="true">MA</div>
      <h2>{me?.email ?? "Membre ADSUM"}</h2>
      <p className="profil-role">{me ? `Compte ${me.role}` : preview ? "Apercu hors connexion" : ""}</p>
      <ul className="profil-list">
        <li>Identite verifiee</li>
        <li>Securite et connexions</li>
        <li>Parametres, langue, RGPD</li>
      </ul>
      <p className="profil-api">API : {apiBaseUrl()}</p>
    </div>
  );
}
