import { getNotifications } from "../api.js";
import { formatDateTime } from "../format.js";
import { useResource } from "../useResource.js";

function targetOf(titre: string | null, type: string | null): "document" | "recensement" | null {
  const t = `${titre ?? ""} ${type ?? ""}`.toLowerCase();
  if (t.includes("document") || t.includes("justificatif") || t.includes("piece")) return "document";
  if (t.includes("recensement")) return "recensement";
  return null;
}

export function Notifications({
  token,
  onDocument,
  onRecensement,
}: {
  token: string;
  onDocument?: () => void;
  onRecensement?: () => void;
}): JSX.Element {
  const { data, loading, error } = useResource(() => getNotifications(token), [token]);

  if (loading) return <div className="empty"><p>Chargement des notifications...</p></div>;
  if (error) return <div className="empty"><p>{error}</p></div>;
  if (!data || data.length === 0) {
    return (
      <div className="empty">
        <div className="empty-glyph" aria-hidden="true">○</div>
        <p>Aucune notification.</p>
      </div>
    );
  }

  return (
    <ul className="list">
      {data.map((n) => {
        const target = targetOf(n.titre, n.type);
        const onClick = target === "document" ? onDocument : target === "recensement" ? onRecensement : undefined;
        return (
          <li
            key={n.id}
            className={`list-item notif ${n.lu ? "" : "notif-unread"} ${onClick ? "row-tap" : ""}`}
            onClick={onClick}
          >
            <div className="list-main">
              <strong>{n.titre ?? "Notification"}</strong>
              <span className="list-sub">{n.corps ?? ""}</span>
              <span className="list-sub faint">{formatDateTime(n.cree_le)}</span>
            </div>
            {!n.lu && <span className="dot" aria-label="non lu" />}
          </li>
        );
      })}
    </ul>
  );
}
