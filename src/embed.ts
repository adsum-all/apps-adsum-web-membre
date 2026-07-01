// Turn an arbitrary session link into either an embeddable iframe source (for
// YouTube) or an external link to open in a new tab. No third party is trusted
// with credentials: only public watch URLs are transformed.

export interface EmbedResult {
  kind: "iframe" | "external";
  src: string;
}

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0] ?? "";
    return id || null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const embedMatch = url.pathname.match(/^\/embed\/([^/?]+)/);
    if (embedMatch) return embedMatch[1] ?? null;
    const shortsMatch = url.pathname.match(/^\/shorts\/([^/?]+)/);
    if (shortsMatch) return shortsMatch[1] ?? null;
  }
  return null;
}

export function toEmbed(url: string): EmbedResult {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: "external", src: url };
  }
  const id = youtubeId(parsed);
  if (id) {
    return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
  }
  return { kind: "external", src: url };
}
