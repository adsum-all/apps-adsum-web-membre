// Design tokens copied verbatim from the ADSUM member prototype (03-prototype),
// so the live app matches the high-fidelity design pixel for pixel.

export const T = {
  fd: "'Space Grotesk',sans-serif",
  fu: "'IBM Plex Sans',sans-serif",
  fm: "'IBM Plex Mono',monospace",
  b400: "#5b82d8",
  b500: "#3563c9",
  b600: "#2a4fad",
  b700: "#223f8a",
  b900: "#172a5a",
  ink: "#16181d",
  mut: "#676b73",
  faint: "#9498a1",
  line: "#e7e9ee",
  surf: "#ffffff",
  bg: "#eef1f6",
  ok: "#1f8a5b",
  okbg: "#e6f3ec",
  warn: "#b5731a",
  warnbg: "#f7eede",
  dng: "#c0392b",
} as const;

/** All navigable routes of the member app, mirroring the prototype. */
export type Route =
  | "card"
  | "qr"
  | "activities"
  | "session"
  | "sent"
  | "history"
  | "detail"
  | "profile"
  | "validation"
  | "notif"
  | "secu"
  | "document"
  | "dossier"
  | "recens"
  | "first"
  | "forgot"
  | "otp"
  | "engage"
  | "settings";

/** Routes shown full screen (no bottom tab bar). */
export const FULLSCREEN: Route[] = ["qr", "session", "sent", "first", "forgot", "otp", "engage"];

export const gradient = `linear-gradient(180deg,${T.b500},${T.b600})`;
export const cardGradient = `linear-gradient(155deg,${T.b600},${T.b900})`;
