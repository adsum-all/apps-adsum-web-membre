// Turn a session link into an in-app player when the source allows it, so the
// member watches the broadcast inside ADSUM by default. YouTube, Vimeo, Facebook
// and direct video files can be embedded for free (the source serves the stream).
// Zoom and Telegram forbid framing (X-Frame-Options), so they can only be opened;
// the original URL is always returned for a secondary "open on source" action.

export type EmbedKind = "iframe" | "video" | "external";

export interface EmbedResult {
  kind: EmbedKind;
  src: string; // iframe/video source, or the original URL when external
  provider: string; // display name of the source, for the secondary link
  original: string; // always the original URL
}

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0] ?? "";
    return id || null;
  }
  if (host === "youtube.com") {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const embed = url.pathname.match(/^\/embed\/([^/?]+)/);
    if (embed) return embed[1] ?? null;
    const live = url.pathname.match(/^\/live\/([^/?]+)/);
    if (live) return live[1] ?? null;
    const shorts = url.pathname.match(/^\/shorts\/([^/?]+)/);
    if (shorts) return shorts[1] ?? null;
  }
  return null;
}

export function toEmbed(url: string): EmbedResult {
  const ext = (provider: string): EmbedResult => ({ kind: "external", src: url, provider, original: url });
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return ext("la source");
  }
  const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");

  const yt = youtubeId(u);
  if (yt) {
    return { kind: "iframe", src: `https://www.youtube.com/embed/${yt}?rel=0`, provider: "YouTube", original: url };
  }
  if (host === "player.vimeo.com") {
    return { kind: "iframe", src: url, provider: "Vimeo", original: url };
  }
  if (host === "vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean)[0];
    if (id && /^\d+$/.test(id)) {
      return { kind: "iframe", src: `https://player.vimeo.com/video/${id}`, provider: "Vimeo", original: url };
    }
  }
  if (host === "facebook.com" || host === "fb.watch" || host === "fb.com") {
    const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
    return { kind: "iframe", src, provider: "Facebook", original: url };
  }
  if (/\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(u.pathname)) {
    return { kind: "video", src: url, provider: "la source", original: url };
  }
  if (host.endsWith("zoom.us") || host.endsWith("zoom.com")) return ext("Zoom");
  if (host === "t.me" || host.endsWith("telegram.org")) return ext("Telegram");
  return ext("la source");
}

export type PlatformKey = "zoom" | "telegram" | "whatsapp" | "youtube" | "facebook" | "vimeo" | "autre";

export interface PlatformInfo {
  key: PlatformKey;
  label: string;
  color: string; // brand colour for the chip
  embeddable: boolean; // can be watched directly inside the app
}

const PLATFORMS: Record<PlatformKey, { label: string; color: string; embeddable: boolean }> = {
  zoom: { label: "Zoom", color: "#2D8CFF", embeddable: false },
  telegram: { label: "Telegram", color: "#2AABEE", embeddable: false },
  whatsapp: { label: "WhatsApp", color: "#25D366", embeddable: false },
  youtube: { label: "YouTube", color: "#FF0000", embeddable: true },
  facebook: { label: "Facebook", color: "#1877F2", embeddable: true },
  vimeo: { label: "Vimeo", color: "#1AB7EA", embeddable: true },
  autre: { label: "Lien externe", color: "#64748b", embeddable: false },
};

// Detect the broadcast platform from a URL so the session can show its name,
// brand colour and whether it can be watched inside the app.
export function detectPlatform(url: string): PlatformInfo {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "").replace(/^m\./, "");
  } catch {
    return { key: "autre", ...PLATFORMS.autre };
  }
  let key: PlatformKey = "autre";
  if (host === "youtube.com" || host === "youtu.be") key = "youtube";
  else if (host === "vimeo.com" || host === "player.vimeo.com") key = "vimeo";
  else if (host === "facebook.com" || host === "fb.watch" || host === "fb.com") key = "facebook";
  else if (host.endsWith("zoom.us") || host.endsWith("zoom.com")) key = "zoom";
  else if (host === "t.me" || host.endsWith("telegram.org")) key = "telegram";
  else if (host === "wa.me" || host.endsWith("whatsapp.com")) key = "whatsapp";
  return { key, ...PLATFORMS[key] };
}
