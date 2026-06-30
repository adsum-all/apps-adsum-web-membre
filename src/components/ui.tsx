import type { CSSProperties, ReactNode } from "react";

import { T, gradient } from "../proto.js";

export function Screen({ children, style }: { children: ReactNode; style?: CSSProperties }): JSX.Element {
  return <div className="scr" style={{ padding: "6px 18px 14px", ...style }}>{children}</div>;
}

export function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }): JSX.Element {
  return (
    <div
      onClick={onBack}
      className="tap"
      style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 0 14px" }}
    >
      <span style={{ fontSize: 20, color: T.mut }}>‹</span>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
    </div>
  );
}

export function Title({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 19, padding: "8px 0 14px" }}>{children}</div>
  );
}

export function PrimaryButton({
  label,
  onClick,
  disabled,
  marginTop = "auto",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  marginTop?: number | string;
}): JSX.Element {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className="tap"
      style={{
        marginTop,
        height: 50,
        background: disabled ? T.faint : gradient,
        borderRadius: 13,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 600,
        fontSize: 14,
        gap: 7,
        opacity: disabled ? 0.7 : 1,
        boxShadow: disabled ? "none" : "0 10px 22px -10px rgba(42,79,173,.7)",
      }}
    >
      {label}
    </div>
  );
}

export function CenteredState({ glyph, text }: { glyph: string; text: string }): JSX.Element {
  return (
    <div className="scr" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 28 }}>
      <div style={{ fontSize: 40, color: T.b400, marginBottom: 12 }} aria-hidden="true">{glyph}</div>
      <p style={{ color: T.mut, fontSize: 13, margin: 0 }}>{text}</p>
    </div>
  );
}

export function Banner({ kind, children }: { kind: "info" | "warn" | "ok"; children: ReactNode }): JSX.Element {
  const map = {
    info: { bg: T.bg, bd: T.line, fg: T.mut },
    warn: { bg: T.warnbg, bd: T.warn, fg: T.ink },
    ok: { bg: T.okbg, bd: T.ok, fg: T.ink },
  }[kind];
  return (
    <div style={{ background: map.bg, border: `1px solid ${map.bd}`, borderRadius: 12, padding: 12, fontSize: 11.5, color: map.fg, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

/** A 6-box code input row, controlled by the parent value string. */
export function CodeBoxes({ value, size = 6 }: { value: string; size?: number }): JSX.Element {
  return (
    <div style={{ display: "flex", gap: 7, width: "100%" }}>
      {Array.from({ length: size }).map((_, i) => {
        const filled = i < value.length;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              aspectRatio: "0.85",
              border: `1.5px solid ${filled ? T.b600 : T.line}`,
              background: filled ? T.surf : T.surf,
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {value[i] ?? ""}
          </div>
        );
      })}
    </div>
  );
}
