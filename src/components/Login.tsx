import { useState } from "react";

import { ApiError, login, loginVerify } from "../api.js";
import { useT } from "../i18n.js";
import { PasswordInput } from "./PasswordInput.js";

export interface AuthContext {
  token: string;
  doitChangerMdp: boolean;
  email: string;
  motDePasse: string;
}

interface LoginProps {
  onAuth: (ctx: AuthContext) => void;
  onForgot?: () => void;
}

export function Login({ onAuth, onForgot }: LoginProps): JSX.Element {
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Second factor step: shown only when the server asks for a code.
  const [step, setStep] = useState<"password" | "otp">("password");
  const [canal, setCanal] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [confiance, setConfiance] = useState(true);
  const [renvoye, setRenvoye] = useState(false);

  async function submitPassword(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await login(email, password);
      if (res.otpRequired) {
        setCanal(res.canal);
        setStep("otp");
      } else if (res.token) {
        onAuth({ token: res.token, doitChangerMdp: res.doitChangerMdp, email, motDePasse: password });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.networkError"));
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await loginVerify(email, password, code.trim(), confiance);
      if (res.token) onAuth({ token: res.token, doitChangerMdp: res.doitChangerMdp, email, motDePasse: password });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.networkError"));
    } finally {
      setBusy(false);
    }
  }

  async function renvoyer(): Promise<void> {
    setError(null);
    try {
      const res = await login(email, password);
      setCanal(res.canal);
      setRenvoye(true);
    } catch {
      setError(t("login.resendError"));
    }
  }

  const canalLabel = canal === "telegram" ? t("login.canalTelegram") : t("login.canalEmail");

  return (
    <div className="login">
      <div className="login-logo" aria-hidden="true">
        A
      </div>
      <div className="login-brand">ADSUM</div>
      <p className="login-sub">{t("login.tagline")}</p>

      {step === "password" ? (
        <form onSubmit={submitPassword} className="login-form">
          <label>
            <span>{t("login.email")}</span>
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            <span>{t("login.password")}</span>
            <PasswordInput autoComplete="current-password" value={password} onChange={setPassword} required />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? t("login.connecting") : t("login.signIn")}
          </button>
          <button type="button" className="login-link" onClick={onForgot}>
            {t("login.forgot")}
          </button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="login-form">
          <p className="login-sub" style={{ marginTop: 0 }}>
            {t("login.otpIntro").replace("{canal}", canalLabel)}
          </p>
          <label>
            <span>{t("login.otpLabel")}</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              required
              autoFocus
            />
          </label>
          <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={confiance} onChange={(e) => setConfiance(e.target.checked)} style={{ width: 18, height: 18 }} />
            <span style={{ fontWeight: 500 }}>{t("login.trustDevice")}</span>
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy || code.length < 6}>
            {busy ? t("login.verifying") : t("login.validateCode")}
          </button>
          <button type="button" className="login-link" onClick={() => void renvoyer()}>
            {renvoye ? t("login.codeSent") : t("login.resendCode")}
          </button>
          <button type="button" className="login-link" onClick={() => { setStep("password"); setCode(""); setError(null); }}>
            {t("login.backToLogin")}
          </button>
        </form>
      )}
    </div>
  );
}
