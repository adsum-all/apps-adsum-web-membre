import { useEffect, useState } from "react";

import { ApiError, premiereConnexion, requestOtp } from "../api.js";
import { useT } from "../i18n.js";
import { T, gradient } from "../proto.js";
import { PasswordInput } from "./PasswordInput.js";

interface Props {
  email: string;
  motDePasseTemporaire: string;
  onDone: (token: string) => void;
}

export function PremiereConnexion({ email, motDePasseTemporaire, onDone }: Props): JSX.Element {
  const t = useT();
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
      setError(t("premiere.weakPw"));
      return;
    }
    if (!match) {
      setError(t("premiere.mismatch"));
      return;
    }
    if (code.length !== 6) {
      setError(t("premiere.needCode"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = await premiereConnexion(email, motDePasseTemporaire, nouveau, code);
      onDone(token);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.networkError"));
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
      <div style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 22, textAlign: "center" }}>{t("premiere.title")}</div>
      <p className="login-sub">{t("premiere.intro")}</p>

      <span style={lbl}>{t("settings.pwNewLabel")}</span>
      <PasswordInput value={nouveau} onChange={setNouveau} autoComplete="new-password" style={inp} />
      <div style={{ display: "flex", gap: 10, fontSize: 9.5, marginTop: 6, color: strong ? T.ok : T.mut }}>
        <span>{long ? "✓" : "○"} {t("settings.pwLen")}</span>
        <span>{maj ? "✓" : "○"} {t("settings.pwUpper")}</span>
        <span>{num ? "✓" : "○"} {t("settings.pwDigit")}</span>
      </div>

      <span style={lbl}>{t("settings.pwConfirmLabel")}</span>
      <PasswordInput value={confirme} onChange={setConfirme} autoComplete="new-password" style={inp} />

      <span style={lbl}>{t("premiere.codeLabel")}</span>
      <input
        inputMode="numeric"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="••••••"
        style={{ ...inp, letterSpacing: 8, fontFamily: T.fm }}
      />
      {provider === "console" && (
        <p style={{ fontSize: 10.5, color: T.warn, marginTop: 6 }}>{t("premiere.providerWarn")}</p>
      )}

      {error && <p style={{ color: T.dng, fontSize: 12.5, marginTop: 10 }}>{error}</p>}

      <div
        onClick={() => void submit()}
        className="tap"
        style={{ marginTop: 18, height: 50, background: busy ? T.faint : gradient, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 15 }}
      >
        {busy ? t("common.validating") : t("premiere.submit")}
      </div>
    </div>
  );
}
