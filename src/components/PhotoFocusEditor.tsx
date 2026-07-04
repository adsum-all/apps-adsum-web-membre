import { useEffect, useRef, useState } from "react";

import { T } from "../proto.js";

/** Face focal point as CSS object-position percentages (0-100). */
export interface Focus {
  x: number;
  y: number;
}

const DEFAULT_FOCUS: Focus = { x: 50, y: 30 };

interface FaceBox {
  boundingBox: { x: number; y: number; width: number; height: number };
}

interface FaceDetectorLike {
  detect: (img: HTMLImageElement) => Promise<FaceBox[]>;
}

/** Detect the face and return its centre as image percentages, or null when the
 * browser has no Shape Detection API or no face is found. Never throws. */
async function detectFaceFocus(img: HTMLImageElement): Promise<Focus | null> {
  const Ctor = (window as unknown as { FaceDetector?: new (o: object) => FaceDetectorLike }).FaceDetector;
  if (!Ctor || !img.naturalWidth || !img.naturalHeight) return null;
  try {
    const detector = new Ctor({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await detector.detect(img);
    const first = faces?.[0];
    if (!first) return null;
    const b = first.boundingBox;
    return {
      x: Math.round(((b.x + b.width / 2) / img.naturalWidth) * 100),
      y: Math.round(((b.y + b.height / 2) / img.naturalHeight) * 100),
    };
  } catch {
    return null;
  }
}

const clamp = (v: number): number => Math.max(0, Math.min(100, Math.round(v)));

interface PhotoFocusEditorProps {
  /** A newly selected file (staging) or an existing photo URL (re-framing). */
  file?: File;
  imageUrl?: string;
  initialFocus?: Focus | null;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (focus: Focus) => void;
}

/**
 * Frame the face inside the round avatar without ever distorting the photo.
 * The source image is shown at its natural ratio; tapping a point (typically the
 * face) sets the focal point, and a live circular preview shows exactly how the
 * avatar will look (object-fit: cover, so no stretching). The face is detected
 * automatically when the browser supports it; the member can re-tap to adjust.
 */
export function PhotoFocusEditor({
  file,
  imageUrl,
  initialFocus,
  busy = false,
  onCancel,
  onConfirm,
}: PhotoFocusEditorProps): JSX.Element {
  const [url, setUrl] = useState<string | null>(imageUrl ?? null);
  const [focus, setFocus] = useState<Focus>(initialFocus ?? DEFAULT_FOCUS);
  const [detecting, setDetecting] = useState(false);
  const [noFace, setNoFace] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const autoTried = useRef(false);

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  async function autoDetect(): Promise<void> {
    const img = imgRef.current;
    if (!img) return;
    setDetecting(true);
    setNoFace(false);
    const found = await detectFaceFocus(img);
    if (found) setFocus(found);
    else setNoFace(true);
    setDetecting(false);
  }

  function onImageLoad(): void {
    // Auto-centre on the face once, only when the caller did not pass a focus.
    if (autoTried.current || initialFocus) return;
    autoTried.current = true;
    void autoDetect();
  }

  function onTap(e: React.MouseEvent<HTMLImageElement>): void {
    const rect = e.currentTarget.getBoundingClientRect();
    setFocus({
      x: clamp(((e.clientX - rect.left) / rect.width) * 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100),
    });
  }

  const pos = `${focus.x}% ${focus.y}%`;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(10,14,25,0.62)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 18, padding: 18, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(10,14,25,0.35)" }}
      >
        <p style={{ fontSize: 14, fontWeight: 700, color: T.ink, margin: "0 0 4px", fontFamily: T.fd }}>Cadrer la photo</p>
        <p style={{ fontSize: 11.5, color: T.mut, margin: "0 0 12px", lineHeight: 1.5 }}>
          Touchez votre visage pour le centrer dans le cercle. L'aperçu à droite montre le rendu exact, sans jamais déformer la photo.
        </p>

        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            {url && (
              <img
                ref={imgRef}
                src={url}
                alt="Photo à cadrer"
                onLoad={onImageLoad}
                onClick={onTap}
                crossOrigin="anonymous"
                style={{ width: "100%", maxHeight: 260, objectFit: "contain", display: "block", borderRadius: 10, cursor: "crosshair", background: T.surf }}
              />
            )}
            <span
              aria-hidden="true"
              style={{ position: "absolute", left: `${focus.x}%`, top: `${focus.y}%`, width: 18, height: 18, marginLeft: -9, marginTop: -9, borderRadius: "50%", border: "2px solid #fff", boxShadow: "0 0 0 2px rgba(53,99,201,0.9)", pointerEvents: "none" }}
            />
          </div>

          <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", border: `2px solid ${T.line}` }}>
              {url && <img src={url} alt="Aperçu" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />}
            </div>
            <span style={{ fontSize: 10.5, color: T.mut }}>Aperçu rond</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void autoDetect()}
          disabled={detecting}
          className="tap"
          style={{ marginTop: 12, width: "100%", height: 38, background: T.surf, border: `1px solid ${T.line}`, borderRadius: 10, color: T.ink, fontWeight: 600, fontSize: 12.5 }}
        >
          {detecting ? "Détection du visage..." : "Recadrer automatiquement sur le visage"}
        </button>
        {noFace && (
          <p style={{ fontSize: 11, color: T.mut, margin: "6px 0 0" }}>
            Aucun visage détecté automatiquement : touchez votre visage sur la photo pour le centrer.
          </p>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="tap"
            style={{ flex: 1, height: 44, background: T.surf, border: `1px solid ${T.line}`, borderRadius: 12, color: T.ink, fontWeight: 600, fontSize: 13.5 }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(focus)}
            disabled={busy}
            className="tap"
            style={{ flex: 1, height: 44, background: `linear-gradient(180deg,${T.b500},${T.b600})`, border: "none", borderRadius: 12, color: "#fff", fontWeight: 600, fontSize: 13.5, opacity: busy ? 0.6 : 1 }}
          >
            {busy ? "..." : "Valider le cadrage"}
          </button>
        </div>
      </div>
    </div>
  );
}
