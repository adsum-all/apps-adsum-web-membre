import { useEffect, useMemo, useState } from "react";

import {
  ApiError,
  type ConsentSummary,
  type SignatureRef,
  demanderSignature,
  getConsentDocs,
  getSignatureEtat,
  verifierSignature,
} from "../api.js";
import { useT } from "../i18n.js";
import { T } from "../proto.js";
import { PrimaryButton } from "./ui.js";
import { ConsentReader } from "./ConsentReader.js";

type Phase = "reading" | "code" | "signed";

/**
 * Orchestrates the blocking consent step shown right before the final submit.
 * The member reads and accepts every blocking document, requests a signature
 * code, then validates it. onSigned unlocks submission in the parent form.
 */
export function SignatureEngagement({ token, onSigned }: { token: string; onSigned: () => void }): JSX.Element {
  const t = useT();
  const [docs, setDocs] = useState<ConsentSummary[]>([]);
  const [accepted, setAccepted] = useState<Map<string, string>>(new Map());
  const [phase, setPhase] = useState<Phase>("reading");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getConsentDocs(token)
      .then((list) => {
        if (alive) setDocs([...list].sort((a, b) => a.ordre - b.ordre));
      })
      .catch(() => {
        if (alive) setError(t("consent.loadError"));
      });
    getSignatureEtat(token)
      .then((etat) => {
        if (alive && etat.signe) {
          setPhase("signed");
          onSigned();
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function onAccept(cle: string, version: string): void {
    setAccepted((prev) => new Map(prev).set(cle, version));
  }

  const allBlockingAccepted = useMemo(
    () => docs.filter((d) => d.bloquant).every((d) => accepted.has(d.cle)),
    [docs, accepted],
  );

  async function demander(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const documents: SignatureRef[] = docs
        .filter((d) => accepted.has(d.cle))
        .map((d) => ({ cle: d.cle, version: accepted.get(d.cle) as string }));
      await demanderSignature(token, documents);
      setPhase("code");
    } catch {
      setError(t("consent.requestError"));
    } finally {
      setBusy(false);
    }
  }

  async function valider(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await verifierSignature(token, code.trim());
      setPhase("signed");
      onSigned();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 400 ? t("consent.invalidCode") : t("consent.requestError"));
    } finally {
      setBusy(false);
    }
  }

  if (phase === "signed") {
    return (
      <div style={{ background: T.okbg, border: `1px solid ${T.ok}`, borderRadius: 13, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 18, color: T.ok }}>✓</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ok }}>{t("consent.signatureDone")}</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 11, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: T.ink }}>{t("consent.proofTitle")}</div>
        <div style={{ fontSize: 10, color: T.mut, lineHeight: 1.45 }}>{t("consent.proofHint")}</div>
      </div>

      {docs.map((d) => (
        <ConsentReader
          key={d.cle}
          token={token}
          doc={d}
          accepted={accepted.has(d.cle)}
          onAccept={onAccept}
        />
      ))}

      {error && <p style={{ color: T.dng, fontSize: 12.5, marginTop: 8 }}>{error}</p>}

      {phase === "reading" && (
        <PrimaryButton
          label={busy ? t("common.loading") : t("consent.approve")}
          onClick={() => void demander()}
          disabled={!allBlockingAccepted || busy}
          marginTop={12}
        />
      )}

      {phase === "code" && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 11.5, color: T.mut, lineHeight: 1.5, margin: "0 0 8px" }}>{t("consent.codeSent")}</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={t("consent.enterCode")}
            style={{ width: "100%", border: `1px solid ${T.line}`, borderRadius: 11, padding: "11px 12px", fontSize: 14, fontFamily: T.fm, background: T.surf, boxSizing: "border-box", letterSpacing: 3, textAlign: "center" }}
          />
          <PrimaryButton
            label={busy ? t("common.loading") : t("consent.validateCode")}
            onClick={() => void valider()}
            disabled={code.trim().length === 0 || busy}
            marginTop={10}
          />
        </div>
      )}
    </div>
  );
}
