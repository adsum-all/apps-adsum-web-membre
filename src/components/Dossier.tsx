import { getDocuments, getEngagements } from "../api.js";
import { useT } from "../i18n.js";
import { useResource } from "../useResource.js";

const DOC_STATUT: Record<string, { labelKey: string; cls: string }> = {
  demande: { labelKey: "dossier.statutDemande", cls: "badge-mut" },
  recu: { labelKey: "dossier.statutRecu", cls: "badge-info" },
  lu: { labelKey: "dossier.statutLu", cls: "badge-info" },
  traite: { labelKey: "dossier.statutTraite", cls: "badge-ok" },
};

function pretty(value: string | null): string {
  if (!value) return "Document";
  const v = value.replace(/_/g, " ");
  return v.charAt(0).toUpperCase() + v.slice(1);
}

export function Dossier({ token }: { token: string }): JSX.Element {
  const t = useT();
  const docs = useResource(() => getDocuments(token), [token]);
  const engs = useResource(() => getEngagements(token), [token]);

  return (
    <div className="recensement">
      <h2>{t("profilNav.dossier.title")}</h2>
      <span className="muted">{t("dossier.subtitle")}</span>

      <p className="section-title profil-group">{t("dossier.sectionPieces")}</p>
      {docs.loading && <p className="muted">{t("common.loading")}</p>}
      {docs.error && <p className="banner banner-warn">{docs.error}</p>}
      {!docs.loading && (docs.data?.length ?? 0) === 0 && (
        <p className="banner banner-info">{t("dossier.emptyPieces")}</p>
      )}
      <ul className="list">
        {(docs.data ?? []).map((d) => {
          const s = DOC_STATUT[d.statut];
          return (
            <li key={d.id} className="list-item">
              <div className="list-main">
                <strong>{pretty(d.type)}</strong>
                {d.demande_le && <span className="list-sub">{t("dossier.requestedOn").replace("{date}", formatDate(d.demande_le))}</span>}
              </div>
              <span className={`badge ${s ? s.cls : "badge-mut"}`}>{s ? t(s.labelKey) : pretty(d.statut)}</span>
            </li>
          );
        })}
      </ul>

      <p className="section-title profil-group">{t("dossier.sectionEngagements")}</p>
      {engs.loading && <p className="muted">{t("common.loading")}</p>}
      {engs.error && <p className="banner banner-warn">{engs.error}</p>}
      {!engs.loading && (engs.data?.length ?? 0) === 0 && (
        <p className="banner banner-info">{t("dossier.emptyEngagements")}</p>
      )}
      <ul className="list">
        {(engs.data ?? []).map((e) => (
          <li key={e.id} className="list-item">
            <div className="list-main">
              <strong>{pretty(e.type)}</strong>
              <span className="list-sub">{t("dossier.version").replace("{v}", String(e.version))}</span>
            </div>
            <span className={`badge ${e.signe ? "badge-ok" : "badge-mut"}`}>
              {e.signe ? t("dossier.signed") : t("dossier.toSign")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
