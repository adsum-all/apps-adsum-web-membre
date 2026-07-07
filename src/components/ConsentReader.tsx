import { useEffect, useRef, useState } from "react";

import { type ConsentDoc, type ConsentSummary, getConsentDoc } from "../api.js";
import { useT } from "../i18n.js";
import { T } from "../proto.js";

interface Props {
  token: string;
  doc: ConsentSummary;
  accepted: boolean;
  onAccept: (cle: string, version: string) => void;
}

/**
 * A single consent document row. The "Lire le document" button opens a full
 * screen reader that streams the full text. The "J'ai lu et j'accepte" checkbox
 * stays disabled until the member has scrolled to the very bottom.
 */
export function ConsentReader({ token, doc, accepted, onAccept }: Props): JSX.Element {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<ConsentDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || content) return;
    let alive = true;
    setError(null);
    getConsentDoc(token, doc.cle)
      .then((d) => {
        if (alive) setContent(d);
      })
      .catch(() => {
        if (alive) setError(t("consent.loadError"));
      });
    return () => {
      alive = false;
    };
  }, [open, content, token, doc.cle, t]);

  // A short document that fits on screen has nothing to scroll, so the scroll-based
  // gate would never open and the member could never tick "I have read and accept".
  // Once the content is rendered, if it does not overflow, enable acceptance.
  useEffect(() => {
    if (!open || !content) return;
    const el = bodyRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 8) setReachedEnd(true);
  }, [open, content]);

  function onScroll(): void {
    const el = bodyRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setReachedEnd(true);
  }

  function toggleAccept(): void {
    if (!reachedEnd || accepted) return;
    onAccept(doc.cle, doc.version);
    setOpen(false);
  }

  return (
    <div
      style={{
        background: T.surf,
        border: `1px solid ${accepted ? T.ok : T.line}`,
        borderRadius: 11,
        padding: 11,
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: accepted ? T.okbg : T.bg,
          color: accepted ? T.ok : T.mut,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {accepted ? "✓" : "◻"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>{doc.titre}</div>
        <div style={{ fontSize: 9.5, color: accepted ? T.ok : T.warn }}>
          {accepted ? t("consent.readAccepted") : t("consent.toRead")}
        </div>
      </div>
      {!accepted && (
        <button
          type="button"
          className="tap"
          onClick={() => setOpen(true)}
          style={{
            border: "none",
            background: T.b600,
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            padding: "7px 12px",
            borderRadius: 8,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {t("consent.read")}
        </button>
      )}

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: T.bg,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 18px",
              borderBottom: `1px solid ${T.line}`,
              background: T.surf,
            }}
          >
            <div style={{ flex: 1, fontFamily: T.fd, fontWeight: 700, fontSize: 15, color: T.ink }}>
              {doc.titre}
            </div>
            <button
              type="button"
              className="tap"
              aria-label={t("common.close")}
              onClick={() => setOpen(false)}
              style={{
                border: "none",
                background: "transparent",
                color: T.mut,
                fontSize: 22,
                lineHeight: 1,
                cursor: "pointer",
                padding: 0,
              }}
            >
              {"×"}
            </button>
          </div>

          <div
            ref={bodyRef}
            onScroll={onScroll}
            style={{ flex: 1, overflowY: "auto", padding: "16px 18px", WebkitOverflowScrolling: "touch" }}
          >
            {error ? (
              <p style={{ color: T.dng, fontSize: 13 }}>{error}</p>
            ) : content ? (
              <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: T.ink }}>
                <div style={{ textAlign: "center", fontFamily: T.fd, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{content.titre}</div>
                <div style={{ textAlign: "center", fontSize: 10.5, color: T.mut, fontFamily: T.fu, borderBottom: `1px solid ${T.line}`, paddingBottom: 10, marginBottom: 14 }}>
                  Version {content.version}
                </div>
                {content.contenu.split(/\n\s*\n/).map((para, i) => (
                  <p key={i} style={{ fontSize: 13.5, lineHeight: 1.7, textAlign: "justify", whiteSpace: "pre-wrap", margin: "0 0 12px" }}>
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <p style={{ color: T.mut, fontSize: 13 }}>{t("common.loading")}</p>
            )}
          </div>

          <div style={{ padding: "12px 18px 18px", borderTop: `1px solid ${T.line}`, background: T.surf }}>
            {!reachedEnd && (
              <p style={{ fontSize: 11, color: T.warn, margin: "0 0 8px" }}>{t("consent.scrollHint")}</p>
            )}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 12.5,
                color: reachedEnd ? T.ink : T.faint,
                cursor: reachedEnd ? "pointer" : "not-allowed",
              }}
            >
              <input
                type="checkbox"
                checked={accepted}
                disabled={!reachedEnd}
                onChange={toggleAccept}
                style={{ width: 18, height: 18, accentColor: T.b600 }}
              />
              {t("consent.iAccept")}
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
