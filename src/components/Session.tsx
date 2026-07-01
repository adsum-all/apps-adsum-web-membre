import { type EvenementOut } from "../api.js";
import { type PlatformInfo, detectPlatform, toEmbed } from "../embed.js";
import { useT } from "../i18n.js";
import { T } from "../proto.js";
import { Participation } from "./Participation.js";

function OpenSource({ view }: { view: ReturnType<typeof toEmbed> }): JSX.Element {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => window.open(view.original, "_blank", "noopener")}
      className="tap"
      style={{ marginTop: 8, width: "100%", background: "none", border: `1px solid ${T.line}`, borderRadius: 10, padding: "9px 12px", color: T.mut, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
    >
      {t("session.openSource").replace("{source}", view.provider)}
    </button>
  );
}

function Diffusion({ evenement }: { evenement: EvenementOut }): JSX.Element {
  const t = useT();
  const lien = evenement.lien_session;

  if (!lien) {
    return (
      <div style={{ background: "#0d1220", borderRadius: 14, height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#7c8598" }}>
        <span style={{ fontSize: 26 }} aria-hidden="true">◷</span>
        <span style={{ fontSize: 12 }}>{t("session.notStarted")}</span>
      </div>
    );
  }

  const view = toEmbed(lien);
  // Watch inside the app by default whenever the source allows it, unless an
  // admin forced the external mode. A secondary link always lets the member
  // open the broadcast on its source (YouTube, Zoom, Telegram, ...).
  const forceExternal = evenement.type_diffusion === "externe";

  if (!forceExternal && view.kind === "iframe") {
    return (
      <div>
        <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 14, overflow: "hidden", background: "#000" }}>
          <iframe
            src={view.src}
            title={evenement.titre}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
        <OpenSource view={view} />
      </div>
    );
  }

  if (!forceExternal && view.kind === "video") {
    return (
      <div>
        <video
          src={view.src}
          controls
          autoPlay
          playsInline
          style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 14, background: "#000" }}
        />
        <OpenSource view={view} />
      </div>
    );
  }

  // Non-embeddable source (Zoom, Telegram, ...) or admin-forced external.
  return (
    <div>
      <div
        onClick={() => window.open(view.original, "_blank", "noopener")}
        className="tap"
        style={{ background: T.b900, borderRadius: 14, padding: "22px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "#fff", cursor: "pointer" }}
      >
        <span style={{ fontSize: 30 }} aria-hidden="true">▶</span>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t("session.watchHere")}</span>
      </div>
      <p style={{ fontSize: 10.5, color: T.faint, margin: "6px 2px 0", textAlign: "center" }}>{t("session.externalNote")}</p>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: PlatformInfo }): JSX.Element {
  const t = useT();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: platform.color, color: "#fff", borderRadius: 999, padding: "4px 11px", fontSize: 11.5, fontWeight: 700 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />
        {platform.label}
      </span>
      <span style={{ fontSize: 11, color: T.mut }}>
        {platform.embeddable ? t("session.onPlatformHere") : t("session.onPlatformExt")}
      </span>
    </div>
  );
}

export function Session({
  token,
  evenement,
  onBack,
  onDone,
}: {
  token: string;
  evenement: EvenementOut;
  onBack: () => void;
  onDone: () => void;
}): JSX.Element {
  const t = useT();
  const platform = evenement.lien_session ? detectPlatform(evenement.lien_session) : null;
  const live = evenement.phase === "en_cours";

  return (
    <div className="scr" style={{ background: T.bg, padding: 0 }}>
      <div style={{ background: T.b900, color: "#fff", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={onBack} className="tap" style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontSize: 18 }}>‹</span>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: live ? "#7ed99a" : "#c7b06a" }} />
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{live ? t("session.live") : t("session.soon")}</span>
          </div>
        </div>
        <span style={{ fontFamily: T.fm, fontSize: 10, color: "#aac0ec" }}>{evenement.titre}</span>
      </div>

      <div style={{ padding: 18 }}>
        {platform && <PlatformBadge platform={platform} />}
        <Diffusion evenement={evenement} />
        {evenement.lieu && <div style={{ fontSize: 11, color: T.mut, marginTop: 8 }}>{evenement.titre} · {evenement.lieu}</div>}

        {/* Participation self-gates: it only appears once the session has started. */}
        <div style={{ marginTop: 14 }}>
          <Participation token={token} eventId={evenement.id} />
        </div>

        <button
          type="button"
          onClick={onDone}
          className="tap"
          style={{ marginTop: 14, width: "100%", height: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: T.surf, color: T.mut, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
        >
          {t("session.back")}
        </button>
      </div>
    </div>
  );
}
