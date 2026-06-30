import { useState } from "react";

import { ApiError, getRecensement, submitRecensement } from "../api.js";
import { useResource } from "../useResource.js";

export function Recensement({ token }: { token: string }): JSX.Element {
  const { data, loading, error } = useResource(() => getRecensement(token), [token]);
  const [engagement, setEngagement] = useState(false);
  const [infos, setInfos] = useState(false);
  const [reaccepte, setReaccepte] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    setBusy(true);
    setSubmitError(null);
    try {
      await submitRecensement(token, {
        confirme_engagement: engagement,
        infos_a_jour: infos,
        reaccepte_engagements: reaccepte,
      });
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Erreur reseau");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="empty"><p>Chargement...</p></div>;
  if (error) return <div className="empty"><p>{error}</p></div>;
  if (!data) {
    return (
      <div className="empty">
        <div className="empty-glyph" aria-hidden="true">✓</div>
        <p>Aucun recensement ouvert pour le moment.</p>
      </div>
    );
  }

  if (done || data.deja_repondu) {
    return (
      <div className="empty">
        <div className="empty-glyph" aria-hidden="true">✓</div>
        <h2>Recensement valide</h2>
        <p>Merci, votre recensement {data.annee} est enregistre.</p>
      </div>
    );
  }

  const ready = engagement && infos && reaccepte;

  return (
    <div className="recensement">
      <h2>Recensement annuel {data.annee}</h2>
      <p className="muted">
        Confirmez que vous etes toujours engage(e) au sein de la fraternite et re-acceptez les engagements
        pour l'annee.
      </p>
      <label className="check-row">
        <input type="checkbox" checked={engagement} onChange={(e) => setEngagement(e.target.checked)} />
        Je suis toujours present(e) et engage(e)
      </label>
      <label className="check-row">
        <input type="checkbox" checked={infos} onChange={(e) => setInfos(e.target.checked)} />
        Mes informations sont a jour
      </label>
      <label className="check-row">
        <input type="checkbox" checked={reaccepte} onChange={(e) => setReaccepte(e.target.checked)} />
        Je re-accepte les engagements
      </label>
      {submitError && <p className="login-error">{submitError}</p>}
      <button type="button" className="btn btn-primary" disabled={!ready || busy} onClick={() => void submit()}>
        {busy ? "Envoi..." : "Valider mon recensement"}
      </button>
    </div>
  );
}
