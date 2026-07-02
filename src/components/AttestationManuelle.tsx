import { useRef, useState } from "react";

import { type AttestationInfo, getAttestation, uploadAttestation, uploadDocument } from "../api.js";
import { useT } from "../i18n.js";
import { attestationPdf, downloadBlob, printBlob } from "../pdf.js";
import { T } from "../proto.js";
import { useResource } from "../useResource.js";

// Statuts pour lesquels la tache est consideree comme terminee cote membre.
const DONE_STATUTS = new Set(["accepted", "not_required"]);

function joursRestants(echeance: string | null): number | null {
  if (!echeance) return null;
  const cible = new Date(`${echeance}T00:00:00`);
  if (Number.isNaN(cible.getTime())) return null;
  const now = new Date();
  const debutJour = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = cible.getTime() - debutJour.getTime();
  return Math.round(diffMs / 86_400_000);
}

// Download and print happen entirely inside the app (a real PDF built in the
// browser, then a Blob download or a hidden-iframe print): never a new page.
function telechargerAttestation(titre: string, texte: string): void {
  downloadBlob(attestationPdf(titre, texte), "Attestation-Sacerdoce-Royal.pdf");
}
function imprimerAttestation(titre: string, texte: string): void {
  printBlob(attestationPdf(titre, texte));
}

function StatusBadge({ info, t }: { info: AttestationInfo; t: (k: string) => string }): JSX.Element {
  const map: Record<string, { key: string; bg: string; fg: string; bd: string }> = {
    under_review: { key: "attest.statusUnderReview", bg: T.okbg, fg: T.ok, bd: T.ok },
    rejected: { key: "attest.statusRejected", bg: "#fae9e7", fg: T.dng, bd: T.dng },
    reminded: { key: "attest.statusReminded", bg: T.warnbg, fg: T.warn, bd: T.warn },
    overdue: { key: "attest.statusOverdue", bg: "#fae9e7", fg: T.dng, bd: T.dng },
  };
  const meta = map[info.statut] ?? { key: "attest.statusAwaiting", bg: T.warnbg, fg: T.warn, bd: T.warn };
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 11px",
        borderRadius: 20,
        background: meta.bg,
        color: meta.fg,
        border: `1px solid ${meta.bd}`,
      }}
    >
      {t(meta.key)}
    </span>
  );
}

function Echeance({ echeance, t }: { echeance: string | null; t: (k: string) => string }): JSX.Element {
  const restant = joursRestants(echeance);
  let libelle: string;
  let couleur: string = T.mut;
  if (echeance == null || restant == null) {
    libelle = t("attest.noDeadline");
  } else if (restant > 0) {
    libelle = t("attest.daysLeft").replace("{n}", String(restant));
  } else if (restant === 0) {
    libelle = t("attest.dueToday");
    couleur = T.warn;
  } else {
    libelle = t("attest.overdueBy").replace("{n}", String(-restant));
    couleur = T.dng;
  }
  return (
    <div style={{ fontSize: 12, color: couleur, marginTop: 6 }}>
      <span style={{ color: T.mut }}>{t("attest.deadline")} : </span>
      <strong>{echeance ?? "-"}</strong>
      {echeance && <span> · {libelle}</span>}
    </div>
  );
}

export function AttestationManuelle({ token }: { token: string }): JSX.Element | null {
  const res = useResource<AttestationInfo>(() => getAttestation(token), [token]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<AttestationInfo | null>(null);
  const t = useT();

  const current = info ?? res.data;
  if (!current || !current.requise || DONE_STATUTS.has(current.statut)) return null;

  const rejected = current.statut === "rejected";

  async function envoyer(): Promise<void> {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const documentId = await uploadDocument(token, "attestation", file);
      const maj = await uploadAttestation(token, documentId);
      setInfo(maj);
      setFile(null);
    } catch {
      setError(t("attest.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        background: T.surf,
        border: `1px solid ${rejected ? T.dng : T.warn}`,
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 14, color: T.ink }}>{t("attest.title")}</div>
        <StatusBadge info={current} t={t} />
      </div>

      <Echeance echeance={current.echeance} t={t} />

      <p style={{ fontSize: 11.5, color: T.mut, lineHeight: 1.5, margin: "8px 0 0" }}>{t("attest.intro")}</p>

      {rejected && (
        <p
          style={{
            background: "#fae9e7",
            border: "1px solid #e0a59c",
            borderRadius: 11,
            padding: 10,
            fontSize: 11.5,
            color: "#922b21",
            margin: "10px 0 0",
          }}
        >
          {t("attest.rejectedHint")}
        </p>
      )}

      <div
        style={{
          background: T.bg,
          border: `1px solid ${T.line}`,
          borderRadius: 11,
          padding: 11,
          margin: "12px 0",
          maxHeight: 150,
          overflow: "auto",
        }}
      >
        <div style={{ fontSize: 10.5, fontWeight: 600, color: T.mut, marginBottom: 5 }}>
          {t("attest.documentTitle")}
        </div>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontFamily: T.fu,
            fontSize: 11.5,
            color: T.ink,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {current.texte}
        </pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div
          onClick={() => telechargerAttestation(t("attest.title"), current.texte)}
          className="tap"
          style={{
            flex: 1,
            height: 42,
            border: `1.5px solid ${T.b600}`,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12.5,
            fontWeight: 600,
            color: T.b600,
          }}
        >
          {t("attest.downloadPdf")}
        </div>
        <div
          onClick={() => imprimerAttestation(t("attest.title"), current.texte)}
          className="tap"
          style={{
            flex: 1,
            height: 42,
            border: `1.5px solid ${T.b600}`,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12.5,
            fontWeight: 600,
            color: T.b600,
          }}
        >
          {t("attest.print")}
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: T.mut, marginBottom: 8 }}>{t("attest.uploadTitle")}</div>

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
        style={{ border: `1.5px dashed ${T.b400}`, borderRadius: 12, padding: 16, textAlign: "center", marginBottom: 10 }}
      >
        <div style={{ fontSize: 22, marginBottom: 5 }}>⬆</div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{t("attest.uploadZone")}</div>
        <div style={{ fontSize: 10, color: T.mut, marginTop: 3 }}>{t("attest.uploadHint")}</div>
      </div>

      {file && (
        <div
          style={{
            background: T.surf,
            border: `1px solid ${T.line}`,
            borderRadius: 11,
            padding: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {file.name}
            </div>
            <div style={{ fontSize: 10, color: T.ok }}>{t("attest.ready")}</div>
          </div>
          <span onClick={() => setFile(null)} className="tap" style={{ color: T.mut }}>
            ✕
          </span>
        </div>
      )}

      {error && <p style={{ color: T.dng, fontSize: 11.5, margin: "0 0 8px" }}>{error}</p>}

      <div
        onClick={file && !busy ? () => void envoyer() : undefined}
        className="tap"
        style={{
          height: 46,
          background: !file || busy ? T.faint : T.b600,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 600,
          fontSize: 13,
          opacity: !file || busy ? 0.7 : 1,
        }}
      >
        {busy ? t("attest.sending") : t("attest.send")}
      </div>
    </div>
  );
}
