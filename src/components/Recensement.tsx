import { useState } from "react";

import { ApiError, getRecensement, submitRecensement } from "../api.js";
import { useT } from "../i18n.js";
import { useResource } from "../useResource.js";

export function Recensement({ token }: { token: string }): JSX.Element {
  const t = useT();
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
      setSubmitError(err instanceof ApiError ? err.message : t("common.networkError"));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="empty"><p>{t("common.loading")}</p></div>;
  if (error) return <div className="empty"><p>{error}</p></div>;
  if (!data) {
    return (
      <div className="empty">
        <div className="empty-glyph" aria-hidden="true">✓</div>
        <p>{t("recens.empty")}</p>
      </div>
    );
  }

  if (done || data.deja_repondu) {
    return (
      <div className="empty">
        <div className="empty-glyph" aria-hidden="true">✓</div>
        <h2>{t("recens.validatedTitle")}</h2>
        <p>{t("recens.thanks").replace("{annee}", String(data.annee))}</p>
      </div>
    );
  }

  const ready = engagement && infos && reaccepte;

  return (
    <div className="recensement">
      <h2>{t("recens.title").replace("{annee}", String(data.annee))}</h2>
      <p className="muted">{t("recens.intro")}</p>
      <label className="check-row">
        <input type="checkbox" checked={engagement} onChange={(e) => setEngagement(e.target.checked)} />
        {t("recens.check1")}
      </label>
      <label className="check-row">
        <input type="checkbox" checked={infos} onChange={(e) => setInfos(e.target.checked)} />
        {t("recens.check2")}
      </label>
      <label className="check-row">
        <input type="checkbox" checked={reaccepte} onChange={(e) => setReaccepte(e.target.checked)} />
        {t("recens.check3")}
      </label>
      {submitError && <p className="login-error">{submitError}</p>}
      <button type="button" className="btn btn-primary" disabled={!ready || busy} onClick={() => void submit()}>
        {busy ? t("common.sending") : t("recens.submit")}
      </button>
    </div>
  );
}
