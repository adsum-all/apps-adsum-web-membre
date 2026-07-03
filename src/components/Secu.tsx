import { T } from "../proto.js";

function deviceLabel(): string {
  const ua = navigator.userAgent;
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/.test(ua)
      ? "iOS"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac/.test(ua)
          ? "macOS"
          : "Appareil";
  const br = /Edg/.test(ua) ? "Edge" : /Chrome/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : /Firefox/.test(ua) ? "Firefox" : "Navigateur";
  return `${os} · ${br}`;
}

export function Secu({ token, onSettings }: { token: string; onSettings: () => void }): JSX.Element {
  void token;
  const now = new Date().toLocaleString("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="scr" style={{ padding: "6px 18px 14px" }}>
      <div style={{ background: T.okbg, border: `1px solid ${T.ok}`, borderRadius: 14, padding: 13, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.ok }} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Session actuelle</span>
        </div>
        <div style={{ fontSize: 11, color: T.mut, lineHeight: 1.5 }}>
          {deviceLabel()} · maintenant
          <br />
          Connexion sécurisée (jeton signé)
        </div>
      </div>

      <p style={{ fontFamily: T.fm, fontSize: 9, color: T.mut, margin: "4px 0 9px" }}>HISTORIQUE DES CONNEXIONS</p>
      <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 12, padding: 12, display: "flex", gap: 11 }}>
        <span style={{ fontSize: 15 }}>🔐</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600 }}>Connexion en cours</div>
          <div style={{ fontSize: 10, color: T.mut }}>{now} · {deviceLabel()}</div>
        </div>
      </div>
      <div style={{ marginTop: 10, background: T.bg, border: `1px solid ${T.line}`, borderRadius: 12, padding: 12, fontSize: 10.5, color: T.mut, lineHeight: 1.5 }}>
        ⓘ L'historique géolocalisé (ville, pays, appareil) et la déconnexion à distance des autres sessions sont
        activés dès que le suivi des connexions est en service côté serveur.
      </div>

      <div onClick={onSettings} className="tap" style={{ marginTop: 14, height: 44, border: `1.5px solid ${T.ink}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 600 }}>
        Mot de passe & double authentification
      </div>
    </div>
  );
}
