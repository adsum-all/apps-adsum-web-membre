import { useEffect, useState } from "react";

import { ApiError, premiereConnexion, requestOtp } from "../api.js";
import { T, gradient } from "../proto.js";

interface Props {
  email: string;
  motDePasseTemporaire: string;
  onDone: (token: string) => void;
}

export function PremiereConnexion({ email, motDePasseTemporaire, onDone }: Props): JSX.Element {
  const [nouveau, setNouveau] = useState("");
  const [confirme, setConfirme] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>("");

  useEffect(() => {
    // Send the e-mail OTP immediately (banking-style double validation).
    void requestOtp(email, "login_2fa")
      .then((r) => setProvider(r.provider))
      .catch(() => undefined);
  }, [email]);

  const long = nouveau.length >= 8;
  const maj = /[A-Z]/.test(nouveau);
  const num = /[0-9]/.test(nouveau);
  const strong = long && maj && num;
  const match = nouveau.length > 0 && nouveau === confirme;

  async function submit(): Promise<void> {
    if (!strong) {
      setError("Mot de passe trop faible (8+ caractères, 1 majuscule, 1 chiffre).");
      return;
    }
    if (!match) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (code.length !== 6) {
      setError("Saisissez le code à 6 chiffres reçu par e-mail.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = await premiereConnexion(email, motDePasseTemporaire, nouveau, code);
      onDone(token);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  const lbl = { fontFamily: T.fm, fontSize: 9, color: T.mut, margin: "14px 0 5px", display: "block" } as const;
  const inp = { width: "100%", height: 46, border: `1.5px solid ${T.b600}`, borderRadius: 11, padding: "0 13px", fontSize: 14, fontFamily: T.fu, background: T.surf } as const;

  return (
    <div className="login" style={{ justifyContent: "flex-start", paddingTop: 40 }}>
      <div className="login-logo" aria-hidden="true">
        A
      </div>
      <div style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 22, textAlign: "center" }}>Première connexion</div>
      <p className="login-sub">
        Vous êtes connecté(e) avec le mot de passe temporaire. Choisissez votre propre mot de passe pour sécuriser votre compte.
      </p>

      <span style={lbl}>NOUVEAU MOT DE PASSE</span>
      <input type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} style={inp} />
      <div style={{ display: "flex", gap: 10, fontSize: 9.5, marginTop: 6, color: strong ? T.ok : T.mut }}>
        <span>{long ? "✓" : "○"} 8+ car.</span>
        <span>{maj ? "✓" : "○"} majuscule</span>
        <span>{num ? "✓" : "○"} chiffre</span>
      </div>

      <span style={lbl}>CONFIRMER</span>
      <input type="password" value={confirme} onChange={(e) => setConfirme(e.target.value)} style={inp} />

      <span style={lbl}>CODE REÇU PAR E-MAIL</span>
      <input
        inputMode="numeric"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="••••••"
        style={{ ...inp, letterSpacing: 8, fontFamily: T.fm }}
      />
      {provider === "console" && (
        <p style={{ fontSize: 10.5, color: T.warn, marginTop: 6 }}>
          (Fournisseur e-mail non encore configuré pour cet envoi : le code n'arrivera qu'une fois le domaine d'envoi vérifié.)
        </p>
      )}

      {error && <p style={{ color: T.dng, fontSize: 12.5, marginTop: 10 }}>{error}</p>}

      <div
        onClick={() => void submit()}
        className="tap"
        style={{ marginTop: 18, height: 50, background: busy ? T.faint : gradient, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 15 }}
      >
        {busy ? "Validation..." : "Valider et continuer"}
      </div>
    </div>
  );
}
