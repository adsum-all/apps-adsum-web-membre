import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

import { type MembreProfile, getQrToken } from "../api.js";
import { civilName } from "../name.js";
import { AttestationManuelle } from "./AttestationManuelle.js";
import { QrCard } from "./QrCard.js";

// The card tab: fetch the server-signed QR token and refresh it before it
// expires, so the member always shows a valid code at the door.
const REFRESH_MS = 60_000;

export function Carte({ token, profile }: { token: string; profile: MembreProfile | null }): JSX.Element {
  const [serverToken, setServerToken] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = (): void => {
      getQrToken(token)
        .then((qr) => {
          if (alive) {
            setServerToken(qr.token);
            setNote(null);
          }
        })
        .catch(() => {
          if (alive) setNote("QR momentanément indisponible, réessai en cours.");
        });
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [token]);

  return (
    <>
      <AttestationManuelle token={token} />
      <QrCard
        matricule={profile?.matricule ?? "ADS-000000"}
        membreId={profile?.id ?? "00000000-0000-0000-0000-000000000000"}
        verifie={profile?.verifie ?? false}
        preview={false}
        serverToken={serverToken}
        nom={profile ? civilName(profile) || null : null}
        tribu={profile?.tribu}
        patriarche={profile?.patriarche}
        engagement={profile?.type_membre}
        authToken={token}
        prenoms={profile?.prenoms}
        memberNom={profile?.nom}
        focusX={profile?.photo_focus_x}
        focusY={profile?.photo_focus_y}
        estBerger={profile?.est_berger}
        nomPastoral={profile?.nom_pastoral_affiche}
        fonctionPrincipale={profile?.fonctions?.[0]?.libelle ?? null}
        fonctionPerimetre={profile?.fonctions?.[0]?.perimetre ?? null}
      />
      <button type="button" className="btn btn-ghost" onClick={() => setFullscreen(true)} disabled={!serverToken}>
        Afficher en plein écran
      </button>
      {note && <p className="card-hint">{note}</p>}
      {fullscreen && serverToken && (
        <FullscreenQr
          token={serverToken}
          matricule={profile?.matricule ?? "ADS-000000"}
          onClose={() => setFullscreen(false)}
        />
      )}
    </>
  );
}

function FullscreenQr({
  token,
  matricule,
  onClose,
}: {
  token: string;
  matricule: string;
  onClose: () => void;
}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      void QRCode.toCanvas(canvasRef.current, token, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    }
  }, [token]);

  return (
    <div className="fs-qr" role="dialog" aria-label="QR plein écran" onClick={onClose}>
      <p className="fs-qr-hint">Luminosité maximale recommandée</p>
      <canvas ref={canvasRef} width={300} height={300} aria-label="QR signé du membre" />
      <p className="fs-qr-id">{matricule}</p>
      <button type="button" className="btn btn-primary fs-qr-close" onClick={onClose}>
        Fermer
      </button>
    </div>
  );
}
