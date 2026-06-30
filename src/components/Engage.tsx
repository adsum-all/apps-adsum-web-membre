import { useState } from "react";

import { type EngagementItem, acceptEngagement, getEngagements } from "../api.js";
import { T } from "../proto.js";
import { useResource } from "../useResource.js";
import { PrimaryButton } from "./ui.js";

const REQUIRED = [
  { type: "consentement_rgpd", label: "Consentement RGPD" },
  { type: "confidentialite", label: "Confidentialité" },
  { type: "lettre_engagement", label: "Lettre d'engagement" },
];

export function Engage({ token, onDone }: { token: string; onDone: () => void }): JSX.Element {
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
      setError("Signature impossible. Réessayez.");
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
                <div style={{ fontSize: 12, fontWeight: 600 }}>{r.label}</div>
                <div style={{ fontSize: 9.5, color: done ? T.ok : T.warn }}>{done ? "Lu & accepté" : "À lire & accepter"}</div>
              </div>
              {!done && (
                <button
                  type="button"
                  className="tap"
                  disabled={busy === r.type || loading}
                  onClick={() => void accept(r.type)}
                  style={{ border: "none", background: T.b600, color: "#fff", fontSize: 11, fontWeight: 600, padding: "7px 12px", borderRadius: 8, cursor: "pointer" }}
                >
                  {busy === r.type ? "..." : "Accepter"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 11, padding: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Preuve de consentement</div>
        <div style={{ fontSize: 9.5, color: T.mut, lineHeight: 1.4 }}>
          Chaque acceptation est horodatée et tracée (preuve conservée). La signature par code e-mail renforce la preuve quand l'envoi d'e-mail est activé.
        </div>
      </div>

      {error && <p style={{ color: T.dng, fontSize: 12 }}>{error}</p>}

      {allSigned ? (
        <div style={{ marginTop: 14, background: T.okbg, border: `1px solid ${T.ok}`, borderRadius: 13, padding: 14, textAlign: "center", color: T.ok, fontWeight: 600, fontSize: 13 }}>
          ✓ Tous les engagements sont signés
        </div>
      ) : (
        <PrimaryButton label="Tout accepter et signer" onClick={() => void Promise.all(REQUIRED.filter((r) => !signed.has(r.type)).map((r) => accept(r.type)))} />
      )}

      <div onClick={onDone} className="tap" style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: T.mut, padding: 8 }}>
        Revenir à mon identité
      </div>
    </div>
  );
}
