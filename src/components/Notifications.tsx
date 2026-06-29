import { getNotifications } from "../api.js";
import { formatDateTime } from "../format.js";
import { useResource } from "../useResource.js";

export function Notifications({ token }: { token: string }): JSX.Element {
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
      {data.map((n) => (
        <li key={n.id} className={`list-item notif ${n.lu ? "" : "notif-unread"}`}>
          <div className="list-main">
            <strong>{n.titre ?? "Notification"}</strong>
            <span className="list-sub">{n.corps ?? ""}</span>
            <span className="list-sub faint">{formatDateTime(n.cree_le)}</span>
          </div>
          {!n.lu && <span className="dot" aria-label="non lu" />}
        </li>
      ))}
    </ul>
  );
}
