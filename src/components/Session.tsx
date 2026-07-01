import { type EvenementOut } from "../api.js";
import { type PlatformInfo, detectPlatform, toEmbed } from "../embed.js";
import { useT } from "../i18n.js";
import { T } from "../proto.js";
import { Participation } from "./Participation.js";

function PlatformButton({ url, platform, primary }: { url: string; platform: PlatformInfo; primary?: boolean }): JSX.Element {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => window.open(url, "_blank", "noopener")}
      className="tap"
      style={{
        marginTop: 8, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        background: primary ? platform.color : "none", color: primary ? "#fff" : T.mut,
        border: primary ? "none" : `1px solid ${T.line}`, borderRadius: 11,
        padding: primary ? "13px 12px" : "9px 12px", fontSize: primary ? 13.5 : 12, fontWeight: 600, cursor: "pointer",
      }}
    >
      {primary ? "▶ " : ""}{t("session.openSource").replace("{source}", platform.label)}
    </button>
  );
}

function Diffusion({ evenement }: { evenement: EvenementOut }): JSX.Element {
  const t = useT();
  const liens = evenement.liens.length ? evenement.liens : evenement.lien_session ? [evenement.lien_session] : [];

  if (liens.length === 0) {
    return (
      <div style={{ background: "#0d1220", borderRadius: 14, height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#7c8598" }}>
        <span style={{ fontSize: 26 }} aria-hidden="true">◷</span>
        <span style={{ fontSize: 12 }}>{t("session.notStarted")}</span>
      </div>
    );
  }

  const forceExternal = evenement.type_diffusion === "externe";
  const views = liens.map((url) => ({ url, embed: toEmbed(url), platform: detectPlatform(url) }));
  const first = views[0]!;
  // Preferred action = watch inside the app when a source allows it; every other
  // link becomes a secondary platform button. Multiple simultaneous broadcasts
  // are all offered, each opening its own platform.
  const primaryEmbed = forceExternal ? undefined : views.find((v) => v.embed.kind === "iframe" || v.embed.kind === "video");
  const secondaries = primaryEmbed ? views.filter((v) => v !== primaryEmbed) : views.slice(1);

  return (
    <div>
      {primaryEmbed ? (
        primaryEmbed.embed.kind === "iframe" ? (
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 14, overflow: "hidden", background: "#000" }}>
            <iframe
              src={primaryEmbed.embed.src}
              title={evenement.titre}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        ) : (
          <video src={primaryEmbed.embed.src} controls autoPlay playsInline style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 14, background: "#000" }} />
        )
      ) : (
        <PlatformButton url={first.url} platform={first.platform} primary />
      )}

      {secondaries.map((v) => (
        <PlatformButton key={v.url} url={v.url} platform={v.platform} />
      ))}

      {!primaryEmbed && <p style={{ fontSize: 10.5, color: T.faint, margin: "6px 2px 0", textAlign: "center" }}>{t("session.externalNote")}</p>}
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
