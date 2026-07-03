import { useState } from "react";

import { requestOtp, resetPassword } from "../api.js";
import { T, gradient } from "../proto.js";

export function Forgot({ onBack, onDone }: { onBack: () => void; onDone: () => void }): JSX.Element {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>("");

  const strong = nouveau.length >= 8 && /[A-Z]/.test(nouveau) && /[0-9]/.test(nouveau);

  async function sendCode(): Promise<void> {
    if (!email.includes("@")) {
      setMsg("Saisissez une adresse e-mail valide.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await requestOtp(email.trim(), "password_reset");
      setProvider(r.provider);
      setStep("reset");
    } catch {
      setMsg("Envoi impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  async function doReset(): Promise<void> {
    if (code.length !== 6 || !strong) {
      setMsg("Code à 6 chiffres et mot de passe robuste requis.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await resetPassword(email.trim(), code, nouveau);
      onDone();
    } catch {
      setMsg("Code invalide ou expiré.");
    } finally {
      setBusy(false);
    }
  }

  const labelStyle = { fontFamily: T.fm, fontSize: 9, color: T.mut, marginBottom: 5, display: "block" } as const;
  const inputStyle = { height: 46, width: "100%", background: T.surf, border: `1.5px solid ${T.b600}`, borderRadius: 11, padding: "0 13px", fontSize: 14, fontFamily: T.fu, marginBottom: 14 } as const;

  return (
    <div className="scr" style={{ background: T.bg, padding: "24px 22px", display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div onClick={onBack} className="tap" style={{ fontSize: 20, color: T.mut, padding: "4px 0 10px" }}>‹</div>
      <div style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 19 }}>Mot de passe oublié</div>

      {step === "email" ? (
        <>
          <div style={{ fontSize: 12, color: T.mut, lineHeight: 1.55, margin: "8px 0 20px" }}>
            Saisissez votre e-mail. Vous recevez un <strong>code</strong> pour réinitialiser votre mot de passe vous-même.
          </div>
          <span style={labelStyle}>ADRESSE E-MAIL</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@mail.fr" style={inputStyle} />
          <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 11, padding: 12, fontSize: 11, color: T.mut, lineHeight: 1.5 }}>
            ⓘ Aucune demande à l'administration : le code est <strong>généré automatiquement</strong> et envoyé par e-mail. Valable quelques minutes.
          </div>
          {msg && <p style={{ color: T.dng, fontSize: 12 }}>{msg}</p>}
          <div onClick={() => void sendCode()} className="tap" style={{ marginTop: "auto", height: 50, background: busy ? T.faint : gradient, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14 }}>
            {busy ? "Envoi..." : "Recevoir un code"}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 12, color: T.mut, lineHeight: 1.55, margin: "8px 0 18px" }}>
            Un code à 6 chiffres a été envoyé à <strong>{email}</strong>. Saisissez-le et choisissez un nouveau mot de passe.
            {provider === "console" && (
              <span style={{ display: "block", color: T.warn, marginTop: 6 }}>
                (Fournisseur e-mail non encore configuré : l'envoi réel sera actif dès qu'un fournisseur est paramétré.)
              </span>
            )}
          </div>
          <span style={labelStyle}>CODE À 6 CHIFFRES</span>
          <input
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            style={{ ...inputStyle, letterSpacing: 8, fontFamily: T.fm }}
          />
          <span style={labelStyle}>NOUVEAU MOT DE PASSE</span>
          <input type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} style={inputStyle} />
          <div style={{ display: "flex", gap: 8, fontSize: 9.5, color: strong ? T.ok : T.mut, marginTop: -6 }}>
            <span>{nouveau.length >= 8 ? "✓" : "○"} 8+ car.</span>
            <span>{/[A-Z]/.test(nouveau) ? "✓" : "○"} majuscule</span>
            <span>{/[0-9]/.test(nouveau) ? "✓" : "○"} chiffre</span>
          </div>
          {msg && <p style={{ color: T.dng, fontSize: 12 }}>{msg}</p>}
          <div onClick={() => void doReset()} className="tap" style={{ marginTop: "auto", height: 50, background: busy ? T.faint : gradient, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14 }}>
            {busy ? "Validation..." : "Réinitialiser et se connecter"}
          </div>
        </>
      )}
    </div>
  );
}
