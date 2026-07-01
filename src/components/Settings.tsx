import { useEffect, useState } from "react";

import {
  type MembreProfile,
  type NotifPreferences,
  changePassword,
  demanderSuppression,
  enregistrerWhatsapp,
  exportDonneesRGPD,
  getNotifPreferences,
  setNotifPreferences,
  telegramLien,
  telegramVerifier,
} from "../api.js";
import { T } from "../proto.js";

function Toggle({ label, hint, on, onChange }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void }): JSX.Element {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${T.line}` }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ fontSize: 10, color: T.mut }}>{hint}</div>}
      </div>
      <div
        onClick={() => onChange(!on)}
        className="tap"
        style={{ width: 44, height: 26, borderRadius: 999, background: on ? T.b600 : T.line, position: "relative", transition: "background .15s" }}
      >
        <div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }): JSX.Element {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontFamily: T.fm, fontSize: 9, color: T.mut }}>{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ height: 44, background: T.surf, border: `1px solid ${T.line}`, borderRadius: 11, padding: "0 13px", fontSize: 14, fontFamily: T.fu }}
      />
    </label>
  );
}

function Row({ label, hint, value, onClick }: { label: string; hint?: string; value?: string; onClick?: () => void }): JSX.Element {
  return (
    <div
      onClick={onClick}
      className={onClick ? "tap" : undefined}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: `1px solid ${T.line}` }}
    >
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ fontSize: 10, color: T.mut }}>{hint}</div>}
      </div>
      <span style={{ fontSize: 12, color: T.mut }}>{value ?? "›"}</span>
    </div>
  );
}

export function Settings({
  token,
  profile,
  onLogout,
}: {
  token: string;
  profile: MembreProfile | null;
  onLogout: () => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirme, setConfirme] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [prefs, setPrefs] = useState<NotifPreferences | null>(null);

  useEffect(() => {
    void getNotifPreferences(token).then(setPrefs).catch(() => undefined);
  }, [token]);

  function togglePref(key: keyof NotifPreferences, value: boolean): void {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    void setNotifPreferences(token, next).catch(() => undefined);
  }

  const strong = nouveau.length >= 8 && /[A-Z]/.test(nouveau) && /[0-9]/.test(nouveau);

  async function save(): Promise<void> {
    if (!strong || nouveau !== confirme) {
      setMsg({ kind: "err", text: "Mot de passe trop faible ou non confirmé." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await changePassword(token, ancien, nouveau);
      setMsg({ kind: "ok", text: "Mot de passe mis à jour." });
      setAncien("");
      setNouveau("");
      setConfirme("");
      setOpen(false);
    } catch {
      setMsg({ kind: "err", text: "Mot de passe actuel incorrect." });
    } finally {
      setBusy(false);
    }
  }

  async function exportData(): Promise<void> {
    try {
      const data = await exportDonneesRGPD(token);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `adsum-mes-donnees-${profile?.matricule ?? "export"}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg({ kind: "ok", text: "Export complet de vos données téléchargé." });
    } catch {
      setMsg({ kind: "err", text: "Export impossible pour le moment." });
    }
  }

  async function requestDeletion(): Promise<void> {
    try {
      const r = await demanderSuppression(token);
      setMsg({
        kind: "ok",
        text: r.deja_demandee
          ? "Une demande de suppression est déjà en cours de traitement."
          : "Demande de suppression transmise à l'administration.",
      });
    } catch {
      setMsg({ kind: "err", text: "Demande impossible pour le moment." });
    }
  }

  return (
    <div className="scr" style={{ padding: "6px 18px 14px" }}>
      <p style={{ fontFamily: T.fm, fontSize: 9, color: T.mut, margin: "4px 0 4px" }}>COMPTE</p>
      <Row label="Changer le mot de passe" hint="Argon2, vérification de l'ancien" onClick={() => setOpen((v) => !v)} value={open ? "▾" : "›"} />
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "12px 0" }}>
          <Field label="MOT DE PASSE ACTUEL" value={ancien} onChange={setAncien} />
          <Field label="NOUVEAU MOT DE PASSE" value={nouveau} onChange={setNouveau} />
          <Field label="CONFIRMER" value={confirme} onChange={setConfirme} />
          <div style={{ display: "flex", gap: 8, fontSize: 9.5, color: strong ? T.ok : T.mut }}>
            <span>{nouveau.length >= 8 ? "✓" : "○"} 8+ car.</span>
            <span>{/[A-Z]/.test(nouveau) ? "✓" : "○"} majuscule</span>
            <span>{/[0-9]/.test(nouveau) ? "✓" : "○"} chiffre</span>
          </div>
          <div onClick={() => void save()} className="tap" style={{ height: 44, background: T.b600, color: "#fff", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, opacity: busy ? 0.7 : 1 }}>
            {busy ? "Enregistrement..." : "Valider le nouveau mot de passe"}
          </div>
        </div>
      )}
      <Row label="Double authentification (2FA)" hint="Code par e-mail à la connexion" value="Recommandé" />

      <p style={{ fontFamily: T.fm, fontSize: 9, color: T.mut, margin: "16px 0 4px" }}>PRÉFÉRENCES</p>
      <Row label="Langue" value="Français" />

      <p style={{ fontFamily: T.fm, fontSize: 9, color: T.mut, margin: "16px 0 4px" }}>NOTIFICATIONS</p>
      {prefs ? (
        <>
          <Toggle label="Événements et formations" hint="Sessions, calendrier" on={prefs.evenements} onChange={(v) => togglePref("evenements", v)} />
          <Toggle label="Suivi de mes demandes" hint="Réponses de l'administration" on={prefs.demandes} onChange={(v) => togglePref("demandes", v)} />
          <Toggle label="Rappels" hint="Recensement, échéances" on={prefs.rappels} onChange={(v) => togglePref("rappels", v)} />
          <Toggle label="Souhaits d'anniversaire" hint="Message de la fraternité le jour J" on={prefs.anniversaire} onChange={(v) => togglePref("anniversaire", v)} />
          <Toggle label="Recevoir aussi par e-mail" hint="En plus des notifications dans l'app" on={prefs.email} onChange={(v) => togglePref("email", v)} />
        </>
      ) : (
        <Row label="Notifications" hint="Chargement..." />
      )}

      <p style={{ fontFamily: T.fm, fontSize: 9, color: T.mut, margin: "16px 0 4px" }}>CANAUX DE RÉCEPTION</p>
      <Canaux token={token} prefs={prefs} onPref={togglePref} onMsg={setMsg} />

      <p style={{ fontFamily: T.fm, fontSize: 9, color: T.mut, margin: "16px 0 4px" }}>DONNÉES (RGPD)</p>
      <Row label="Exporter mes données" hint="Téléchargement immédiat (JSON)" onClick={() => void exportData()} />
      <Row label="Demander la suppression" hint="Traitée par l'administration" onClick={() => void requestDeletion()} />

      {msg && (
        <div style={{ marginTop: 14, background: msg.kind === "ok" ? T.okbg : T.warnbg, border: `1px solid ${msg.kind === "ok" ? T.ok : T.warn}`, borderRadius: 11, padding: 11, fontSize: 11.5, color: T.ink }}>
          {msg.text}
        </div>
      )}

      <div onClick={onLogout} className="tap" style={{ marginTop: 16, height: 46, border: `1px solid ${T.line}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: T.mut, background: T.surf }}>
        Se déconnecter
      </div>
    </div>
  );
}

function Canaux({
  token,
  prefs,
  onPref,
  onMsg,
}: {
  token: string;
  prefs: NotifPreferences | null;
  onPref: (k: keyof NotifPreferences, v: boolean) => void;
  onMsg: (m: { kind: "ok" | "err"; text: string }) => void;
}): JSX.Element {
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [wa, setWa] = useState("");
  const [busy, setBusy] = useState(false);

  async function lierTelegram(): Promise<void> {
    setBusy(true);
    try {
      const r = await telegramLien(token);
      setDeepLink(r.deep_link);
      window.open(r.deep_link, "_blank", "noopener");
    } catch {
      onMsg({ kind: "err", text: "Telegram n'est pas encore configuré côté serveur." });
    } finally {
      setBusy(false);
    }
  }
  async function verifierTelegram(): Promise<void> {
    setBusy(true);
    try {
      const r = await telegramVerifier(token);
      if (r.linked) {
        onPref("telegram", true);
        setDeepLink(null);
        onMsg({ kind: "ok", text: "Compte Telegram lié. Vous recevrez vos notifications sur Telegram." });
      } else {
        onMsg({ kind: "err", text: r.message ?? "Lien non détecté. Appuyez sur Démarrer dans Telegram puis réessayez." });
      }
    } finally {
      setBusy(false);
    }
  }
  async function saveWa(): Promise<void> {
    if (!wa.trim()) return;
    setBusy(true);
    try {
      await enregistrerWhatsapp(token, wa.trim());
      onPref("whatsapp", true);
      onMsg({ kind: "ok", text: "Numéro WhatsApp enregistré." });
    } catch {
      onMsg({ kind: "err", text: "Numéro invalide." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={{ padding: "12px 0", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Telegram</div>
            <div style={{ fontSize: 10, color: T.mut }}>Gratuit. Recevez vos notifications sur Telegram.</div>
          </div>
          <div
            onClick={() => void lierTelegram()}
            className="tap"
            style={{ padding: "8px 14px", borderRadius: 10, background: prefs?.telegram ? T.okbg : T.b600, color: prefs?.telegram ? T.ok : "#fff", fontSize: 12, fontWeight: 600, opacity: busy ? 0.6 : 1 }}
          >
            {prefs?.telegram ? "Lié ✓" : "Lier"}
          </div>
        </div>
        {deepLink && (
          <div onClick={() => void verifierTelegram()} className="tap" style={{ marginTop: 8, textAlign: "center", padding: "9px", borderRadius: 10, border: `1px solid ${T.b600}`, color: T.b600, fontSize: 12, fontWeight: 600 }}>
            J'ai appuyé sur Démarrer, vérifier la liaison
          </div>
        )}
      </div>

      <div style={{ padding: "12px 0", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>WhatsApp</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={wa}
            onChange={(e) => setWa(e.target.value)}
            placeholder="+225 07 00 00 00 00"
            style={{ flex: 1, height: 40, border: `1px solid ${T.line}`, borderRadius: 10, padding: "0 12px", fontSize: 13 }}
          />
          <div onClick={() => void saveWa()} className="tap" style={{ padding: "0 16px", height: 40, display: "flex", alignItems: "center", borderRadius: 10, background: T.b600, color: "#fff", fontSize: 12, fontWeight: 600 }}>
            {prefs?.whatsapp ? "Modifier" : "Ajouter"}
          </div>
        </div>
      </div>
    </>
  );
}
