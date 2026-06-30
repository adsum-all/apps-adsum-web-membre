import { generateKeyPair, signQrToken } from "@adsum/qr";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

// The member digital card. When logged in, the QR holds the real token signed by
// the server (prop serverToken). In the offline preview, it is signed in the
// browser with a freshly generated key, with no fictional personal data.

interface QrCardProps {
  matricule: string;
  membreId: string;
  verifie: boolean;
  preview: boolean;
  serverToken?: string | null;
  nom?: string | null;
  tribu?: string | null;
  patriarche?: string | null;
  engagement?: string | null;
}

const ENGAGEMENT_LABELS: Record<string, string> = {
  membre_simple: "Membre simple",
  nouveau_engage: "Nouvel engage",
  aspirant: "Aspirant",
  engage: "Engage",
  berger: "Berger",
  responsable: "Responsable",
};

export function QrCard({
  matricule,
  membreId,
  verifie,
  preview,
  serverToken,
  nom,
  tribu,
  patriarche,
  engagement,
}: QrCardProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewToken] = useState(() => {
    const kp = generateKeyPair();
    return signQrToken({ membreId, jetonId: crypto.randomUUID(), versionCle: 1, privateKey: kp.privateKey });
  });
  const token = serverToken ?? previewToken;

  useEffect(() => {
    if (canvasRef.current) {
      void QRCode.toCanvas(canvasRef.current, token, {
        width: 190,
        margin: 1,
        color: { dark: "#101218", light: "#ffffff" },
      });
    }
  }, [token]);

  const engagementLabel = engagement ? (ENGAGEMENT_LABELS[engagement] ?? engagement) : "Membre";

  return (
    <div className="card">
      <div className="card-top">
        <span className="card-brand">ADSUM</span>
        <span className="card-chip" aria-hidden="true" />
      </div>
      {nom && <p className="card-name">{nom}</p>}
      <p className="card-tribu">
        {tribu ? `Tribu ${tribu}` : "Sacerdoce Royal"}
        {patriarche ? ` . ${patriarche}` : ""}
      </p>
      <div className="card-qr">
        <canvas ref={canvasRef} width={190} height={190} aria-label="QR signe du membre" />
      </div>
      <div className="card-meta">
        <div className="card-meta-item">
          <span>Matricule</span>
          <strong>{matricule}</strong>
        </div>
        <div className="card-meta-item">
          <span>Engagement</span>
          <strong>{engagementLabel}</strong>
        </div>
        <span className={`badge ${verifie ? "badge-ok" : "badge-mut"}`}>{verifie ? "VERIFIE" : "EN ATTENTE"}</span>
      </div>
      <p className="card-hint">
        {serverToken
          ? "QR signe par le serveur, valable quelques minutes. Presentez-le au controleur."
          : preview
            ? "Apercu : QR signe Ed25519 dans le navigateur. En production il est signe par le serveur."
            : "Presentez ce code au controleur a l'entree."}
      </p>
    </div>
  );
}
