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
}

export function QrCard({ matricule, membreId, verifie, preview, serverToken }: QrCardProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewToken] = useState(() => {
    const kp = generateKeyPair();
    return signQrToken({ membreId, jetonId: crypto.randomUUID(), versionCle: 1, privateKey: kp.privateKey });
  });
  const token = serverToken ?? previewToken;

  useEffect(() => {
    if (canvasRef.current) {
      void QRCode.toCanvas(canvasRef.current, token, {
        width: 220,
        margin: 1,
        color: { dark: "#101218", light: "#ffffff" },
      });
    }
  }, [token]);

  return (
    <div className="card">
      <div className="card-top">
        <span className="card-brand">ADSUM</span>
        <span className="card-chip" aria-hidden="true" />
      </div>
      <div className="card-qr">
        <canvas ref={canvasRef} width={220} height={220} aria-label="QR signe du membre" />
      </div>
      <div className="card-id">
        <strong>{matricule}</strong>
        <span className={`badge ${verifie ? "badge-ok" : "badge-mut"}`}>
          {verifie ? "ACTIF . VERIFIE" : "EN ATTENTE"}
        </span>
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
