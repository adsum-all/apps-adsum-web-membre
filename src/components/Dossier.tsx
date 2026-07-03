import { getDocuments, getEngagements } from "../api.js";
import { useResource } from "../useResource.js";

const DOC_STATUT: Record<string, { label: string; cls: string }> = {
  demande: { label: "Demandé", cls: "badge-mut" },
  recu: { label: "Reçu", cls: "badge-info" },
  lu: { label: "En cours", cls: "badge-info" },
  traite: { label: "Validé", cls: "badge-ok" },
};

function pretty(value: string | null): string {
  if (!value) return "Document";
  const v = value.replace(/_/g, " ");
  return v.charAt(0).toUpperCase() + v.slice(1);
}

export function Dossier({ token }: { token: string }): JSX.Element {
  const docs = useResource(() => getDocuments(token), [token]);
  const engs = useResource(() => getEngagements(token), [token]);

  return (
    <div className="recensement">
      <h2>Mon dossier</h2>
      <span className="muted">Suivi de la validation de votre identité et de vos engagements.</span>

      <p className="section-title profil-group">Pièces et validation d'identité</p>
      {docs.loading && <p className="muted">Chargement...</p>}
      {docs.error && <p className="banner banner-warn">{docs.error}</p>}
      {!docs.loading && (docs.data?.length ?? 0) === 0 && (
        <p className="banner banner-info">Aucune pièce au dossier pour le moment.</p>
      )}
      <ul className="list">
        {(docs.data ?? []).map((d) => {
          const s = DOC_STATUT[d.statut] ?? { label: pretty(d.statut), cls: "badge-mut" };
          return (
            <li key={d.id} className="list-item">
              <div className="list-main">
                <strong>{pretty(d.type)}</strong>
                {d.demande_le && <span className="list-sub">Demandé le {formatDate(d.demande_le)}</span>}
              </div>
              <span className={`badge ${s.cls}`}>{s.label}</span>
            </li>
          );
        })}
      </ul>

      <p className="section-title profil-group">Engagements</p>
      {engs.loading && <p className="muted">Chargement...</p>}
      {engs.error && <p className="banner banner-warn">{engs.error}</p>}
      {!engs.loading && (engs.data?.length ?? 0) === 0 && (
        <p className="banner banner-info">Aucun engagement enregistré pour le moment.</p>
      )}
      <ul className="list">
        {(engs.data ?? []).map((e) => (
          <li key={e.id} className="list-item">
            <div className="list-main">
              <strong>{pretty(e.type)}</strong>
              <span className="list-sub">Version {e.version}</span>
            </div>
            <span className={`badge ${e.signe ? "badge-ok" : "badge-mut"}`}>
              {e.signe ? "Signé" : "À signer"}
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
