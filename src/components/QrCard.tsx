import { generateKeyPair, signQrToken } from "@adsum/qr";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

// The member digital card with a real Ed25519 signed QR. In production the QR is
// signed by the server; here it is signed in the browser for the live preview,
// with a real generated member id (no fictional personal data).

interface QrCardProps {
  matricule: string;
  membreId: string;
  verifie: boolean;
  preview: boolean;
}

export function QrCard({ matricule, membreId, verifie, preview }: QrCardProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [token] = useState(() => {
    const kp = generateKeyPair();
    return signQrToken({ membreId, jetonId: crypto.randomUUID(), versionCle: 1, privateKey: kp.privateKey });
  });

  useEffect(() => {
    if (canvasRef.current) {
      void QRCode.toCanvas(canvasRef.current, token, { width: 220, margin: 1, color: { dark: "#101218", light: "#ffffff" } });
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
        {preview
          ? "Apercu : QR signe Ed25519 (en production il est signe par le serveur). Presentez-le au controleur."
          : "Presentez ce code au controleur a l'entree."}
      </p>
    </div>
  );
}
