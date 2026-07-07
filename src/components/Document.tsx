import { useRef, useState } from "react";

import { submitDocument } from "../api.js";
import { useT } from "../i18n.js";
import { T } from "../proto.js";
import { PrimaryButton } from "./ui.js";

export function Document({ token, onSent }: { token: string; onSent: () => void }): JSX.Element {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(): Promise<void> {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await submitDocument(token, "justificatif", file.name);
      onSent();
    } catch {
      setError(t("common.sendError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="scr" style={{ padding: "6px 18px 14px", display: "flex", flexDirection: "column" }}>
      <div style={{ background: T.warnbg, border: `1px solid ${T.warn}`, borderRadius: 12, padding: 12, fontSize: 11.5, color: T.ink, lineHeight: 1.5, marginBottom: 14 }}>
        {t("doc.requestBodyA")}<strong>{t("doc.requestBold")}</strong>{t("doc.requestBodyB")}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <div
        onClick={() => inputRef.current?.click()}
        className="tap"
        style={{ border: `1.5px dashed ${T.b400}`, borderRadius: 14, padding: 22, textAlign: "center", marginBottom: 12 }}
      >
        <div style={{ fontSize: 26, marginBottom: 7 }}>⬆</div>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t("doc.upload")}</div>
        <div style={{ fontSize: 10, color: T.mut, marginTop: 3 }}>{t("attest.uploadHint")}</div>
      </div>

      {file && (
        <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>📄</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
            <div style={{ fontSize: 10, color: T.ok }}>{t("attest.ready")}</div>
          </div>
          <span onClick={() => setFile(null)} className="tap" style={{ color: T.mut }}>✕</span>
        </div>
      )}

      {error && <p style={{ color: T.dng, fontSize: 12 }}>{error}</p>}

      <PrimaryButton label={busy ? t("common.sending") : t("attest.send")} onClick={() => void send()} disabled={!file || busy} />
    </div>
  );
}
