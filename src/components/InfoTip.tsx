import { useEffect, useRef, useState } from "react";

import { T } from "../proto.js";

/** Small tappable info icon with a well-placed bubble (mobile-friendly, never
 * overflows). Tap to toggle; tap outside to close. */
export function InfoTip({ text }: { text: string }): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent | TouchEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [open]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline-flex", verticalAlign: "middle" }}>
      <button
        type="button"
        aria-label="Aide"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        style={{
          width: 15,
          height: 15,
          borderRadius: "50%",
          border: `1px solid ${T.line}`,
          background: open ? T.b600 : T.surf,
          color: open ? "#fff" : T.mut,
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1,
          cursor: "pointer",
          padding: 0,
          marginLeft: 6,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            zIndex: 60,
            top: "calc(100% + 5px)",
            left: 0,
            width: 220,
            maxWidth: "70vw",
            background: "#111827",
            color: "#f9fafb",
            borderRadius: 9,
            padding: "8px 10px",
            fontSize: 11,
            lineHeight: 1.45,
            fontWeight: 400,
            boxShadow: "0 10px 26px -10px rgba(0,0,0,.55)",
            textAlign: "left",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
