import { useCallback, useEffect, useState } from "react";

import {
  ApiError,
  type EvenementOut,
  type InscriptionStatut,
  type MembreProfile,
  type PresenceOut,
  getInscription,
  getMembreProfile,
  getPhotoUrl,
  photoObjectPosition,
} from "./api.js";
import { type Lang, LangContext } from "./i18n.js";
import { civilName, initials as memberInitials } from "./name.js";
import { T } from "./proto.js";
import { CompleterProfil } from "./components/CompleterProfil.js";
import { Activites } from "./components/Activites.js";
import { Calendrier } from "./components/Calendrier.js";
import { Carte } from "./components/Carte.js";
import { DetailPresence } from "./components/DetailPresence.js";
import { Document } from "./components/Document.js";
import { Dossier } from "./components/Dossier.js";
import { Demandes } from "./components/Demandes.js";
import { Engage } from "./components/Engage.js";
import { Forgot } from "./components/Forgot.js";
import { Historique } from "./components/Historique.js";
import { Identite } from "./components/Identite.js";
import { Infos } from "./components/Infos.js";
import { type AuthContext, Login } from "./components/Login.js";
import { PremiereConnexion } from "./components/PremiereConnexion.js";
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
  | "sent"
  | "infos"
  | "demandes";

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
  infos: "Mes informations",
  demandes: "Mes demandes",
};

const HIDE_CHROME: ViewId[] = ["session", "sent"];

/** Persisted session token: restored on load so a refresh no longer logs out. */
const TOKEN_KEY = "adsum.token";
function loadToken(): string | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  } catch {
    return null;
  }
}
function saveToken(jwt: string | null): void {
  try {
    if (typeof localStorage === "undefined") return;
    if (jwt) localStorage.setItem(TOKEN_KEY, jwt);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable (private mode): session stays in memory only. */
  }
}

export function App(): JSX.Element {
  const [token, setToken] = useState<string | null>(() => loadToken());
  const [profile, setProfile] = useState<MembreProfile | null>(null);
  const [tab, setTab] = useState<TabId>("carte");
  const [notifOpen, setNotifOpen] = useState(false);
  const [recensementOpen, setRecensementOpen] = useState(false);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [view, setView] = useState<ViewId | null>(null);
  const [detailItem, setDetailItem] = useState<PresenceOut | null>(null);
  const [activeEvent, setActiveEvent] = useState<EvenementOut | null>(null);
  const [authView, setAuthView] = useState<"login" | "forgot">("login");
  const [firstLogin, setFirstLogin] = useState<AuthContext | null>(null);
  const [inscription, setInscription] = useState<InscriptionStatut | null>(null);

  const refreshInscription = useCallback((jwt: string) => {
    void getInscription(jwt)
      .then(setInscription)
      .catch(() =>
        setInscription({
          statut: "approuve",
          motif_refus: null,
          champs_a_corriger: [],
          soumis_le: null,
          decision_le: null,
          verifie: true,
        }),
      );
  }, []);

  const enter = useCallback(
    (jwt: string) => {
      // Show the app immediately; load the profile in the background so the first
      // paint does not wait on a second round trip (the card fills in when ready).
      saveToken(jwt);
      setToken(jwt);
      refreshInscription(jwt);
      void getMembreProfile(jwt)
        .then(setProfile)
        .catch(() => undefined);
    },
    [refreshInscription],
  );

  const [lang, setLang] = useState<Lang>(() => {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("adsum.lang") : null;
    return stored === "en" || stored === "fr" ? stored : "fr";
  });
  useEffect(() => {
    if (profile?.langue === "en" || profile?.langue === "fr") setLang(profile.langue);
  }, [profile?.langue]);
  useEffect(() => {
    if (typeof localStorage !== "undefined") localStorage.setItem("adsum.lang", lang);
  }, [lang]);

  const reloadProfile = useCallback(() => {
    if (token) void getMembreProfile(token).then(setProfile).catch(() => undefined);
  }, [token]);

  const onAuth = useCallback(
    (ctx: AuthContext) => {
      if (ctx.doitChangerMdp) {
        setFirstLogin(ctx);
        return;
      }
      enter(ctx.token);
    },
    [enter],
  );

  const logout = useCallback(() => {
    saveToken(null);
    setToken(null);
    setProfile(null);
    setView(null);
    setFirstLogin(null);
    setInscription(null);
    setTab("carte");
  }, []);

  // Restore a persisted session on load: fetch the profile and status; if the
  // token is no longer valid (expired or revoked) sign out cleanly.
  useEffect(() => {
    if (!token || profile) return;
    refreshInscription(token);
    void getMembreProfile(token)
      .then(setProfile)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (firstLogin) {
    return (
      <Shell>
        <PremiereConnexion
          email={firstLogin.email}
          motDePasseTemporaire={firstLogin.motDePasse}
          onDone={(jwt) => {
            setFirstLogin(null);
            enter(jwt);
          }}
        />
      </Shell>
    );
  }

  if (!token) {
    return (
      <Shell>
        {authView === "forgot" ? (
          <Forgot onBack={() => setAuthView("login")} onDone={() => setAuthView("login")} />
        ) : (
          <Login onAuth={onAuth} onForgot={() => setAuthView("forgot")} />
        )}
      </Shell>
    );
  }

  // Registration gating: a member whose dossier is not yet approved sees the
  // completion form or the tracking screen, not the full app.
  const st = inscription?.statut;
  if (st === "incomplet" || st === "modification_demandee") {
    return (
      <Shell>
        <header className="topbar">
          <span className="topbar-title">Inscription</span>
          <button type="button" className="bell" onClick={logout} aria-label="Quitter">
            ⏻
          </button>
        </header>
        <main className="screen">
          <CompleterProfil
            token={token}
            profile={profile}
            statut={st}
            motif={inscription?.motif_refus}
            champsACorriger={inscription?.champs_a_corriger ?? []}
            onSubmitted={() => refreshInscription(token)}
          />
        </main>
      </Shell>
    );
  }
  if (st === "soumis" || st === "en_revue" || st === "refuse") {
    return (
      <Shell>
        <InscriptionAttente statut={st} motif={inscription?.motif_refus} onLogout={logout} />
      </Shell>
    );
  }

  const chromeHidden = view !== null && HIDE_CHROME.includes(view);

  return (
    <LangContext.Provider value={lang}>
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
          <Settings token={token} profile={profile} onLogout={logout} onLang={setLang} />
        ) : view === "infos" ? (
          <Infos token={token} profile={profile} onDemande={() => setView("demandes")} onProfileChange={reloadProfile} />
        ) : view === "demandes" ? (
          <Demandes token={token} />
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
            {tab === "calendrier" && (
              <Calendrier
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
                token={token}
                profile={profile}
                onRecensement={() => setRecensementOpen(true)}
                onDossier={() => setDossierOpen(true)}
                onIdentite={() => setView("identite")}
                onSecu={() => setView("secu")}
                onSettings={() => setView("settings")}
                onInfos={() => setView("infos")}
                onDemandes={() => setView("demandes")}
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
    </LangContext.Provider>
  );
}

function Shell({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="phone">
      <div className="phone-inner">{children}</div>
    </div>
  );
}

function InscriptionAttente({
  statut,
  motif,
  onLogout,
}: {
  statut: string;
  motif?: string | null;
  onLogout: () => void;
}): JSX.Element {
  const refuse = statut === "refuse";
  const steps = [
    { key: "soumis", label: "Dossier soumis" },
    { key: "en_revue", label: "En cours d'examen" },
    { key: "decision", label: refuse ? "Refusé" : "Décision finale" },
  ];
  const reached = refuse ? 3 : statut === "en_revue" ? 2 : 1;
  return (
    <div className="login" style={{ justifyContent: "flex-start", paddingTop: 48 }}>
      <div
        className="login-logo"
        aria-hidden="true"
        style={{ background: refuse ? "linear-gradient(140deg,#c0392b,#922b21)" : undefined }}
      >
        {refuse ? "!" : "⏳"}
      </div>
      <div style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 21, textAlign: "center" }}>
        {refuse ? "Inscription refusée" : "Inscription en cours d'examen"}
      </div>
      <p className="login-sub">
        {refuse
          ? "Votre dossier n'a pas été validé. Vous pouvez contacter l'administration."
          : "Votre dossier a été soumis. L'administration l'examine. Vous serez notifié(e) de la décision."}
      </p>
      <div style={{ margin: "10px 0 18px" }}>
        {steps.map((s, i) => {
          const done = i + 1 < reached;
          const active = i + 1 === reached;
          const color = refuse && i === 2 ? T.dng : done ? T.ok : active ? T.b600 : T.line;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 2px" }}>
              <div style={{ width: 26, height: 26, borderRadius: 13, background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 400, color: active || done ? T.ink : T.mut }}>{s.label}</span>
            </div>
          );
        })}
      </div>
      {refuse && motif && (
        <p style={{ background: "#fae9e7", border: "1px solid #e0a59c", borderRadius: 11, padding: 12, fontSize: 12.5, color: "#922b21" }}>
          Motif : {motif}
        </p>
      )}
      <button type="button" className="btn btn-ghost btn-block" onClick={onLogout} style={{ marginTop: 14 }}>
        Se déconnecter
      </button>
    </div>
  );
}

function tabTitle(tab: TabId): string {
  return { carte: "Ma carte", activites: "Activités", calendrier: "Calendrier", historique: "Historique", profil: "Profil" }[tab];
}

function NavRow({
  glyph,
  title,
  subtitle,
  onClick,
  accent,
}: {
  glyph: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  accent?: boolean;
}): JSX.Element {
  return (
    <div
      onClick={onClick}
      className="tap"
      style={{
        background: accent ? T.okbg : T.surf,
        border: `1px solid ${accent ? T.ok : T.line}`,
        borderRadius: 14,
        padding: "12px 13px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 9,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          flexShrink: 0,
          background: accent ? T.ok : "#eaeefb",
          color: accent ? "#fff" : T.b600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        {glyph}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: accent ? T.ok : T.ink }}>{title}</div>
        <div style={{ fontSize: 10.5, color: T.mut, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {subtitle}
        </div>
      </div>
      <span style={{ color: T.faint, fontSize: 18 }}>›</span>
    </div>
  );
}

function Profil({
  token,
  profile,
  onRecensement,
  onDossier,
  onIdentite,
  onSecu,
  onSettings,
  onInfos,
  onDemandes,
}: {
  token: string;
  profile: MembreProfile | null;
  onRecensement: () => void;
  onDossier: () => void;
  onIdentite: () => void;
  onSecu: () => void;
  onSettings: () => void;
  onInfos: () => void;
  onDemandes: () => void;
}): JSX.Element {
  const fullName =
    profile && (profile.prenoms || profile.nom || profile.nom_affichage)
      ? civilName(profile)
      : (profile?.email ?? "Membre ADSUM");
  const initials = profile ? memberInitials(profile) : "?";
  const fonctionsList = profile?.fonctions ?? [];
  const bergerLabel = profile?.est_berger ? profile.nom_pastoral_affiche : null;
  const verified = profile?.verifie ?? false;
  const since = profile?.date_entree ? new Date(profile.date_entree).getFullYear() : null;
  // Signed URL of the identity photo; falls back to initials when absent.
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void getPhotoUrl(token)
      .then((r) => {
        if (alive) setPhotoUrl(r.url);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <div className="profil" style={{ padding: "10px 2px 14px" }}>
      <div className="profil-head">
        {photoUrl ? (
          <img className="avatar avatar-photo" src={photoUrl} alt="Photo d'identité" style={{ objectPosition: photoObjectPosition(profile) }} />
        ) : (
          <div className="avatar" aria-hidden="true">
            {initials}
          </div>
        )}
        <h2 style={{ marginBottom: 4 }}>{fullName}</h2>
        <p className="profil-role" style={{ marginBottom: 8 }}>
          {profile?.matricule ?? ""}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 8 }}>
          {bergerLabel && (
            <span style={{ fontSize: 12.5, fontWeight: 700, color: T.warn, background: T.warnbg, border: `1px solid ${T.warn}33`, padding: "3px 11px", borderRadius: 20 }}>
              {bergerLabel}
            </span>
          )}
          {fonctionsList.map((f, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 600, color: T.b600, background: "#eef2fb", border: `1px solid ${T.b600}33`, padding: "3px 11px", borderRadius: 20 }}>
              {f.libelle}
              {f.perimetre ? ` - ${f.perimetre}` : ""}
            </span>
          ))}
          {!bergerLabel && fonctionsList.length === 0 && (
            <span style={{ fontSize: 12, fontWeight: 600, color: T.mut, background: "#f2f4f8", border: `1px solid ${T.line}`, padding: "3px 11px", borderRadius: 20 }}>
              Membre
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 11px",
            borderRadius: 20,
            background: verified ? T.okbg : T.warnbg,
            color: verified ? T.ok : T.warn,
          }}
        >
          {verified ? "● Identité vérifiée" : "● En attente de vérification"}
        </span>
      </div>

      <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 14, overflow: "hidden", margin: "4px 0 16px" }}>
        {[
          ["Commission", profile?.commission ?? "-"],
          ["Tribu", profile?.tribu ?? "-"],
          ["Membre depuis", since ? String(since) : "-"],
        ].map(([label, value], i) => (
          <div
            key={label}
            style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderBottom: i < 2 ? `1px solid ${T.line}` : "none" }}
          >
            <span style={{ fontSize: 12.5, color: T.mut }}>{label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      <NavRow glyph="✓" title="Mon identité" subtitle="Pièces & validation d'identité" onClick={onIdentite} accent={verified} />
      <NavRow glyph="≣" title="Mes informations" subtitle="Détails & demande de modification" onClick={onInfos} />
      <NavRow glyph="✉" title="Mes demandes" subtitle="Messagerie avec l'administration" onClick={onDemandes} />
      <NavRow glyph="🗎" title="Mon dossier" subtitle="Documents, engagements, suivi" onClick={onDossier} />
      <NavRow glyph="🔒" title="Sécurité & connexions" subtitle="Mot de passe, 2FA, sessions" onClick={onSecu} />
      <NavRow glyph="⚙" title="Paramètres" subtitle="Langue, notifications, RGPD" onClick={onSettings} />
      <NavRow glyph="↻" title="Recensement annuel" subtitle="Confirmer mon engagement" onClick={onRecensement} />
    </div>
  );
}
