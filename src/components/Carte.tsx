import { useEffect, useState } from "react";

import { type MembreProfile, getQrToken } from "../api.js";
import { QrCard } from "./QrCard.js";

// The card tab: fetch the server-signed QR token and refresh it before it
// expires, so the member always shows a valid code at the door.
const REFRESH_MS = 60_000;

export function Carte({ token, profile }: { token: string; profile: MembreProfile | null }): JSX.Element {
  const [serverToken, setServerToken] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

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
          if (alive) setNote("QR momentanement indisponible, reessai en cours.");
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
      <QrCard
        matricule={profile?.matricule ?? "ADS-000000"}
        membreId={profile?.id ?? "00000000-0000-0000-0000-000000000000"}
        verifie={profile?.verifie ?? false}
        preview={false}
        serverToken={serverToken}
      />
      {note && <p className="card-hint">{note}</p>}
    </>
  );
}
