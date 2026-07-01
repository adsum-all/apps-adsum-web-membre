import { useState } from "react";

import { type EvenementOut, participer } from "../api.js";
import { toEmbed } from "../embed.js";
import { useT } from "../i18n.js";
import { T, gradient } from "../proto.js";

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
  const [note, setNote] = useState(4);
  const [commentaire, setCommentaire] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function validate(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await participer(token, evenement.id, note, commentaire || undefined);
      setSent(true);
    } catch {
      setError("Validation impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="scr" style={{ background: "linear-gradient(180deg,#1f8a5b,#176e48)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", padding: "0 28px" }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(255,255,255,.16)", border: "3px solid #bff0d2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, marginBottom: 22 }}>✓</div>
        <div style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 21 }}>Participation validée</div>
        <div style={{ fontSize: 13, color: "#bfe6cf", marginTop: 8, textAlign: "center", lineHeight: 1.5 }}>
          Votre présence en ligne est enregistrée pour {evenement.titre}.
        </div>
        <div onClick={onDone} className="tap" style={{ marginTop: 24, height: 48, width: "100%", background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14 }}>
          Retour aux activités
        </div>
      </div>
    );
  }

  return (
    <div className="scr" style={{ background: T.bg, padding: 0 }}>
      <div style={{ background: T.b900, color: "#fff", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={onBack} className="tap" style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontSize: 18 }}>‹</span>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7ed99a" }} />
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>Session en cours</span>
          </div>
        </div>
        <span style={{ fontFamily: T.fm, fontSize: 10, color: "#aac0ec" }}>en ligne</span>
      </div>

      <div style={{ padding: 18 }}>
        <Diffusion evenement={evenement} />
        {evenement.lieu && <div style={{ fontSize: 11, color: T.mut, marginTop: 8 }}>{evenement.titre} · {evenement.lieu}</div>}

        <div style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16, marginTop: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Questionnaire de fin</div>
          <div style={{ fontSize: 11.5, color: T.mut, marginTop: 2, marginBottom: 14 }}>Validez votre participation</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 9 }}>Votre avis sur la session</div>
          <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                onClick={() => setNote(n)}
                className="tap"
                style={{ flex: 1, aspectRatio: "1", border: `1.5px solid ${note === n ? T.b600 : T.line}`, background: note === n ? T.b600 : T.surf, color: note === n ? "#fff" : T.mut, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13 }}
              >
                {n}
              </div>
            ))}
          </div>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Commentaire (optionnel)"
            rows={2}
            style={{ width: "100%", border: `1px solid ${T.line}`, borderRadius: 10, padding: 10, fontSize: 12.5, fontFamily: T.fu, resize: "vertical", marginBottom: 14 }}
          />
          {error && <p style={{ color: T.dng, fontSize: 12, margin: "0 0 10px" }}>{error}</p>}
          <div onClick={() => void validate()} className="tap" style={{ height: 48, background: busy ? T.faint : gradient, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14, gap: 7 }}>
            {busy ? "Validation..." : "✓ Valider ma participation"}
          </div>
        </div>
      </div>
    </div>
  );
}
