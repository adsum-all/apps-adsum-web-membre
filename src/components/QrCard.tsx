import { generateKeyPair, signQrToken } from "@adsum/qr";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

import { getPhotoUrl } from "../api.js";
import { initials } from "../name.js";

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
  commission?: string | null;
  engagement?: string | null;
  // Session token used to fetch the short-lived signed photo URL. When absent
  // (offline preview) the identity avatar simply shows the initials fallback.
  authToken?: string | null;
  // Raw first name and last name, used only to build the initials fallback when
  // the member has no photo. They are never rendered as text on the card.
  prenoms?: string | null;
  memberNom?: string | null;
  // Face focal point (0-100) so the photo is framed the same way everywhere.
  focusX?: number | null;
  focusY?: number | null;
  // Distinguished line under the name: the consecration name takes priority
  // (Berger/Bergere), otherwise the primary function title. Absent for a plain
  // member, in which case no extra line is shown.
  estBerger?: boolean;
  nomPastoral?: string | null;
  fonctionPrincipale?: string | null;
  fonctionPerimetre?: string | null;
}

/**
 * Shorten the longest role words so a commission title still fits on one line.
 * CSS ellipsis is the final safety net; this keeps the readable start intact.
 */
function abregerRole(texte: string): string {
  return texte
    .replace(/\bResponsable\b/gi, "Respo.")
    .replace(/\bCoordination\b/gi, "Coord.")
    .replace(/\bCoordinateur\b/gi, "Coord.")
    .replace(/\bCoordinatrice\b/gi, "Coord.");
}

const ENGAGEMENT_LABELS: Record<string, string> = {
  membre_simple: "Membre simple",
  membre_actif: "Membre actif",
  nouveau_engage: "Nouvel engagé",
  nouvel_engage: "Nouvel engagé",
  aspirant: "Aspirant",
  engage: "Engagé",
  berger: "Berger",
  responsable: "Responsable",
};

/** Human label for an engagement value: mapped when known, otherwise the raw
 * slug is prettified (underscores to spaces, first letter capitalised) so a raw
 * snake_case value can never appear on the card. */
function engagementDisplay(value?: string | null): string {
  if (!value) return "Membre";
  const known = ENGAGEMENT_LABELS[value];
  if (known) return known;
  const words = value.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function QrCard({
  matricule,
  membreId,
  verifie,
  preview,
  serverToken,
  nom,
  tribu,
  commission,
  engagement,
  authToken,
  prenoms,
  memberNom,
  focusX,
  focusY,
  estBerger,
  nomPastoral,
  fonctionPrincipale,
  fonctionPerimetre,
}: QrCardProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewToken] = useState(() => {
    const kp = generateKeyPair();
    return signQrToken({ membreId, jetonId: crypto.randomUUID(), versionCle: 1, privateKey: kp.privateKey });
  });
  const token = serverToken ?? previewToken;

  // Short-lived signed URL for the member's identity photo. It is resolved on
  // mount (and whenever the session token changes) because the URL expires. A
  // null result means the member has no photo yet: we then show the initials
  // fallback instead, without any console noise.
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      void QRCode.toCanvas(canvasRef.current, token, {
        width: 190,
        margin: 1,
        color: { dark: "#101218", light: "#ffffff" },
      });
    }
  }, [token]);

  useEffect(() => {
    if (!authToken) {
      setPhotoUrl(null);
      return;
    }
    let alive = true;
    getPhotoUrl(authToken)
      .then((res) => {
        if (alive) setPhotoUrl(res.url);
      })
      .catch(() => {
        if (alive) setPhotoUrl(null);
      });
    return () => {
      alive = false;
    };
  }, [authToken]);

  const engagementLabel = engagementDisplay(engagement);
  const avatarInitials = initials({ prenoms, nom: memberNom });

  // The distinguished line: consecration name first, otherwise the primary
  // function (with its scope). A plain member shows nothing here.
  const consecration = estBerger && nomPastoral ? nomPastoral : null;
  const fonctionLigne = !consecration && fonctionPrincipale
    ? abregerRole(fonctionPerimetre ? `${fonctionPrincipale} - ${fonctionPerimetre}` : fonctionPrincipale)
    : null;

  return (
    <div className="card">
      <div className="card-top">
        <span className="card-brand">ADSUM</span>
        <span className="card-chip" aria-hidden="true" />
      </div>
      <div className="card-identity">
        <div className="card-photo">
          {photoUrl ? (
            <img className="card-photo-img" src={photoUrl} alt="Photo d'identité" style={{ objectPosition: `${focusX ?? 50}% ${focusY ?? 30}%` }} />
          ) : (
            <span className="card-photo-fallback" aria-hidden="true">
              {avatarInitials}
            </span>
          )}
        </div>
        <div className="card-identity-text">
          {nom && <p className="card-name">{nom}</p>}
          {consecration && (
            <p
              className="card-role"
              style={{ margin: "1px 0 0", fontSize: 12.5, fontWeight: 700, color: "#ffd98a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}
              title={consecration}
            >
              {consecration}
            </p>
          )}
          {fonctionLigne && (
            <p
              className="card-role"
              style={{ margin: "1px 0 0", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.92)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}
              title={fonctionLigne}
            >
              {fonctionLigne}
            </p>
          )}
          <p className="card-tribu">
            {tribu ? `Tribu ${tribu}` : "Sacerdoce Royal"}
            {commission ? ` · ${commission}` : ""}
          </p>
        </div>
      </div>
      <div className="card-qr">
        <canvas ref={canvasRef} width={190} height={190} aria-label="QR signé du membre" />
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
        <span className={`badge ${verifie ? "badge-ok" : "badge-mut"}`}>{verifie ? "VÉRIFIÉ" : "EN ATTENTE"}</span>
      </div>
      <p className="card-hint">
        {serverToken
          ? "QR signé par le serveur, valable quelques minutes. Présentez-le au contrôleur."
          : preview
            ? "Aperçu : QR signé Ed25519 dans le navigateur. En production il est signé par le serveur."
            : "Présentez ce code au contrôleur à l'entrée."}
      </p>
    </div>
  );
}
