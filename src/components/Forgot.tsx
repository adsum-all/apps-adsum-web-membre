import { useState } from "react";

import { requestOtp, resetPassword } from "../api.js";
import { useT } from "../i18n.js";
import { T, gradient } from "../proto.js";
import { PasswordInput } from "./PasswordInput.js";

export function Forgot({ onBack, onDone }: { onBack: () => void; onDone: () => void }): JSX.Element {
  const t = useT();
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
      setMsg(t("forgot.invalidEmail"));
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await requestOtp(email.trim(), "password_reset");
      setProvider(r.provider);
      setStep("reset");
    } catch {
      setMsg(t("common.sendError"));
    } finally {
      setBusy(false);
    }
  }

  async function doReset(): Promise<void> {
    if (code.length !== 6 || !strong) {
      setMsg(t("forgot.needCodeAndPw"));
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await resetPassword(email.trim(), code, nouveau);
      onDone();
    } catch {
      setMsg(t("forgot.invalidCode"));
    } finally {
      setBusy(false);
    }
  }

  const labelStyle = { fontFamily: T.fm, fontSize: 9, color: T.mut, marginBottom: 5, display: "block" } as const;
  const inputStyle = { height: 46, width: "100%", background: T.surf, border: `1.5px solid ${T.b600}`, borderRadius: 11, padding: "0 13px", fontSize: 14, fontFamily: T.fu, marginBottom: 14 } as const;

  return (
    <div className="scr" style={{ background: T.bg, padding: "24px 22px", display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div onClick={onBack} className="tap" style={{ fontSize: 20, color: T.mut, padding: "4px 0 10px" }}>‹</div>
      <div style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 19 }}>{t("forgot.title")}</div>

      {step === "email" ? (
        <>
          <div style={{ fontSize: 12, color: T.mut, lineHeight: 1.55, margin: "8px 0 20px" }}>
            {t("forgot.introA")}<strong>{t("forgot.introBold")}</strong>{t("forgot.introB")}
          </div>
          <span style={labelStyle}>{t("forgot.emailLabel")}</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("forgot.emailPlaceholder")} style={inputStyle} />
          <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 11, padding: 12, fontSize: 11, color: T.mut, lineHeight: 1.5 }}>
            {t("forgot.noteA")}<strong>{t("forgot.noteBold")}</strong>{t("forgot.noteB")}
          </div>
          {msg && <p style={{ color: T.dng, fontSize: 12 }}>{msg}</p>}
          <div onClick={() => void sendCode()} className="tap" style={{ marginTop: "auto", height: 50, background: busy ? T.faint : gradient, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14 }}>
            {busy ? t("common.sending") : t("forgot.getCode")}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 12, color: T.mut, lineHeight: 1.55, margin: "8px 0 18px" }}>
            {t("forgot.resetIntroA")}<strong>{email}</strong>{t("forgot.resetIntroB")}
            {provider === "console" && (
              <span style={{ display: "block", color: T.warn, marginTop: 6 }}>
                {t("forgot.providerWarn")}
              </span>
            )}
          </div>
          <span style={labelStyle}>{t("forgot.codeLabel")}</span>
          <input
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            style={{ ...inputStyle, letterSpacing: 8, fontFamily: T.fm }}
          />
          <span style={labelStyle}>{t("settings.pwNewLabel")}</span>
          <PasswordInput value={nouveau} onChange={setNouveau} autoComplete="new-password" style={inputStyle} />
          <div style={{ display: "flex", gap: 8, fontSize: 9.5, color: strong ? T.ok : T.mut, marginTop: -6 }}>
            <span>{nouveau.length >= 8 ? "✓" : "○"} {t("settings.pwLen")}</span>
            <span>{/[A-Z]/.test(nouveau) ? "✓" : "○"} {t("settings.pwUpper")}</span>
            <span>{/[0-9]/.test(nouveau) ? "✓" : "○"} {t("settings.pwDigit")}</span>
          </div>
          {msg && <p style={{ color: T.dng, fontSize: 12 }}>{msg}</p>}
          <div onClick={() => void doReset()} className="tap" style={{ marginTop: "auto", height: 50, background: busy ? T.faint : gradient, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14 }}>
            {busy ? t("common.validating") : t("forgot.resetSubmit")}
          </div>
        </>
      )}
    </div>
  );
}
