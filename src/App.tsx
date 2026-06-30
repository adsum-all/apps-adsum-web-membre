import { useCallback, useState } from "react";

import { type EvenementOut, type MembreProfile, type PresenceOut, getMembreProfile } from "./api.js";
import { Activites } from "./components/Activites.js";
import { Carte } from "./components/Carte.js";
import { DetailPresence } from "./components/DetailPresence.js";
import { Document } from "./components/Document.js";
import { Dossier } from "./components/Dossier.js";
import { Engage } from "./components/Engage.js";
import { Historique } from "./components/Historique.js";
import { Identite } from "./components/Identite.js";
import { Login } from "./components/Login.js";
import { Notifications } from "./components/Notifications.js";
import { Recensement } from "./components/Recensement.js";
import { Secu } from "./components/Secu.js";
import { Session } from "./components/Session.js";
import { Settings } from "./components/Settings.js";
import { Suivi } from "./components/Suivi.js";
import { TabBar, type TabId } from "./components/TabBar.js";

type ViewId =
  | "identite"
  | "suivi"
  | "detail"
  | "engage"
  | "document"
  | "settings"
  | "secu"
  | "session"
  | "sent";

const VIEW_TITLES: Record<ViewId, string> = {
  identite: "Mon identité",
  suivi: "Suivi de mon dossier",
  detail: "Détail de la présence",
  engage: "Engagements à signer",
  document: "Document demandé",
  settings: "Paramètres & sécurité",
  secu: "Sécurité & connexions",
  session: "Session en cours",
  sent: "Participation",
};

const HIDE_CHROME: ViewId[] = ["session", "sent"];

export function App(): JSX.Element {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<MembreProfile | null>(null);
  const [tab, setTab] = useState<TabId>("carte");
  const [notifOpen, setNotifOpen] = useState(false);
  const [recensementOpen, setRecensementOpen] = useState(false);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [view, setView] = useState<ViewId | null>(null);
  const [detailItem, setDetailItem] = useState<PresenceOut | null>(null);
  const [activeEvent, setActiveEvent] = useState<EvenementOut | null>(null);

  const onAuth = useCallback(async (jwt: string) => {
    setProfile(await getMembreProfile(jwt));
    setToken(jwt);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setProfile(null);
    setView(null);
    setTab("carte");
  }, []);

  if (!token) {
    return (
      <Shell>
        <Login onAuth={onAuth} />
      </Shell>
    );
  }

  const chromeHidden = view !== null && HIDE_CHROME.includes(view);

  return (
    <Shell>
      {!chromeHidden && (
        <header className="topbar">
          <span className="topbar-title">
            {view
              ? VIEW_TITLES[view]
              : recensementOpen
                ? "Recensement"
                : dossierOpen
                  ? "Mon dossier"
                  : notifOpen
                    ? "Notifications"
                    : tabTitle(tab)}
          </span>
          {view ? (
            <button
              type="button"
              className="bell"
              onClick={() => setView(view === "suivi" || view === "engage" ? "identite" : null)}
            >
              Fermer
            </button>
          ) : recensementOpen || dossierOpen ? (
            <button
              type="button"
              className="bell"
              onClick={() => {
                setRecensementOpen(false);
                setDossierOpen(false);
              }}
            >
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
      )}
      <main className="screen">
        {view === "identite" ? (
          <Identite token={token} profile={profile} onEngagements={() => setView("engage")} onSuivi={() => setView("suivi")} />
        ) : view === "suivi" ? (
          <Suivi token={token} profile={profile} />
        ) : view === "detail" && detailItem ? (
          <DetailPresence presence={detailItem} />
        ) : view === "engage" ? (
          <Engage token={token} onDone={() => setView("identite")} />
        ) : view === "document" ? (
          <Document token={token} onSent={() => setView("suivi")} />
        ) : view === "settings" ? (
          <Settings token={token} profile={profile} onLogout={logout} />
        ) : view === "secu" ? (
          <Secu token={token} onSettings={() => setView("settings")} />
        ) : view === "session" && activeEvent ? (
          <Session
            token={token}
            evenement={activeEvent}
            onBack={() => {
              setView(null);
              setTab("activites");
            }}
            onDone={() => {
              setView(null);
              setTab("activites");
            }}
          />
        ) : recensementOpen ? (
          <Recensement token={token} />
        ) : dossierOpen ? (
          <Dossier token={token} />
        ) : notifOpen ? (
          <Notifications
            token={token}
            onDocument={() => {
              setNotifOpen(false);
              setView("document");
            }}
            onRecensement={() => {
              setNotifOpen(false);
              setRecensementOpen(true);
            }}
          />
        ) : (
          <>
            {tab === "carte" && <Carte token={token} profile={profile} />}
            {tab === "activites" && (
              <Activites
                token={token}
                onJoin={(ev) => {
                  setActiveEvent(ev);
                  setView("session");
                }}
              />
            )}
            {tab === "historique" && (
              <Historique
                token={token}
                onSelect={(p) => {
                  setDetailItem(p);
                  setView("detail");
                }}
              />
            )}
            {tab === "profil" && (
              <Profil
                profile={profile}
                onRecensement={() => setRecensementOpen(true)}
                onDossier={() => setDossierOpen(true)}
                onIdentite={() => setView("identite")}
                onSecu={() => setView("secu")}
                onSettings={() => setView("settings")}
              />
            )}
          </>
        )}
      </main>
      {!chromeHidden && (
        <TabBar
          active={tab}
          onChange={(t) => {
            setNotifOpen(false);
            setRecensementOpen(false);
            setDossierOpen(false);
            setView(null);
            setActiveEvent(null);
            setTab(t);
          }}
        />
      )}
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
  onDossier,
  onIdentite,
  onSecu,
  onSettings,
}: {
  profile: MembreProfile | null;
  onRecensement: () => void;
  onDossier: () => void;
  onIdentite: () => void;
  onSecu: () => void;
  onSettings: () => void;
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

      <button type="button" className="btn btn-ghost btn-block" onClick={onIdentite}>
        Mon identité (validation, pièces)
      </button>
      <button type="button" className="btn btn-ghost btn-block" onClick={onDossier}>
        Mon dossier (documents, engagements)
      </button>
      <button type="button" className="btn btn-ghost btn-block" onClick={onSecu}>
        Sécurité &amp; connexions
      </button>
      <button type="button" className="btn btn-ghost btn-block" onClick={onSettings}>
        Paramètres &amp; sécurité
      </button>
      <button type="button" className="btn btn-ghost btn-block" onClick={onRecensement}>
        Recensement annuel
      </button>
    </div>
  );
}
