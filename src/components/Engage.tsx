import { useState } from "react";

import { type EngagementItem, acceptEngagement, getEngagements } from "../api.js";
import { useT } from "../i18n.js";
import { T } from "../proto.js";
import { useResource } from "../useResource.js";
import { PrimaryButton } from "./ui.js";

const REQUIRED = [
  { type: "consentement_rgpd", labelKey: "engage.consentRgpd" },
  { type: "confidentialite", labelKey: "engage.confidentialite" },
  { type: "lettre_engagement", labelKey: "engage.lettre" },
];

export function Engage({ token, onDone }: { token: string; onDone: () => void }): JSX.Element {
  const t = useT();
  const { data, loading } = useResource(() => getEngagements(token), [token]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localSigned, setLocalSigned] = useState<Set<string>>(new Set());

  const signed = new Set<string>([
    ...(data ?? [])
      .filter((e: EngagementItem) => e.signe)
      .map((e) => e.type)
      .filter((t): t is string => t !== null),
    ...localSigned,
  ]);

  async function accept(type: string): Promise<void> {
    setBusy(type);
    setError(null);
    try {
      await acceptEngagement(token, type);
      setLocalSigned((prev) => new Set(prev).add(type));
    } catch {
      setError(t("engage.signError"));
    } finally {
      setBusy(null);
    }
  }

  const allSigned = REQUIRED.every((r) => signed.has(r.type));

  return (
    <div className="scr" style={{ padding: "6px 18px 14px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {REQUIRED.map((r) => {
          const done = signed.has(r.type);
          return (
            <div key={r.type} style={{ background: T.surf, border: `1px solid ${done ? T.line : T.b600}`, borderRadius: 11, padding: 11, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: done ? T.okbg : T.bg, color: done ? T.ok : T.mut, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                {done ? "✓" : "◻"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{t(r.labelKey)}</div>
                <div style={{ fontSize: 9.5, color: done ? T.ok : T.warn }}>{done ? t("engage.readAccepted") : t("engage.toReadAccept")}</div>
              </div>
              {!done && (
                <button
                  type="button"
                  className="tap"
                  disabled={busy === r.type || loading}
                  onClick={() => void accept(r.type)}
                  style={{ border: "none", background: T.b600, color: "#fff", fontSize: 11, fontWeight: 600, padding: "7px 12px", borderRadius: 8, cursor: "pointer" }}
                >
                  {busy === r.type ? "..." : t("engage.accept")}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 11, padding: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{t("consent.proofTitle")}</div>
        <div style={{ fontSize: 9.5, color: T.mut, lineHeight: 1.4 }}>
          {t("engage.proofHint")}
        </div>
      </div>

      {error && <p style={{ color: T.dng, fontSize: 12 }}>{error}</p>}

      {allSigned ? (
        <div style={{ marginTop: 14, background: T.okbg, border: `1px solid ${T.ok}`, borderRadius: 13, padding: 14, textAlign: "center", color: T.ok, fontWeight: 600, fontSize: 13 }}>
          {t("engage.allSigned")}
        </div>
      ) : (
        <PrimaryButton label={t("engage.acceptAll")} onClick={() => void Promise.all(REQUIRED.filter((r) => !signed.has(r.type)).map((r) => accept(r.type)))} />
      )}

      <div onClick={onDone} className="tap" style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: T.mut, padding: 8 }}>
        {t("engage.backToIdentity")}
      </div>
    </div>
  );
}
