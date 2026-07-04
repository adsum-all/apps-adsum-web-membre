// Single source of truth for the member's displayed identity on the front.
// The civil name NEVER contains a function, role or pastoral appellation: those
// live in their own zones. The server already computes the canonical civil name
// (nom_affichage); this mirrors the same rule as a fallback so lists that do not
// carry nom_affichage still render a clean, family-name-first, capped name.

const PARTICULES = new Set(["de", "du", "des", "la", "le", "les", "da", "di", "del", "della", "dos", "das", "van", "von", "d"]);

function capSegment(seg: string): string {
  const first = seg[0];
  if (!first || !/[a-zà-ÿ]/i.test(first)) return seg;
  return first.toUpperCase() + seg.slice(1).toLowerCase();
}

function capWord(word: string): string {
  return word
    .split(/([-'’])/)
    .map(capSegment)
    .join("");
}

/** A structural unit with its type as a prefix: "Commission SAINT GABRIEL",
 * "Mission EL GIBBOR". Mirrors the back office so a member sees the same label. */
export function uniteLabel(unite: { nom: string; type_organisation?: string | null }): string {
  const slug = (unite.type_organisation ?? "commission").trim() || "commission";
  const prefix = slug.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
  return `${prefix} ${unite.nom}`;
}

/** Given names in title case (particles lowercase), returned as a list. */
export function prenomsList(prenoms?: string | null): string[] {
  const cleaned = (prenoms ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return [];
  return cleaned
    .split(" ")
    .map((mot, i) => (i > 0 && PARTICULES.has(mot.toLowerCase()) ? mot.toLowerCase() : capWord(mot)));
}

function famUpper(nom?: string | null): string {
  return (nom ?? "").trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * Civil display name: prefers the server value (nom_affichage), else composes
 * ``Prenom1 [Prenom2] NOM`` (given names first, then the family name in
 * uppercase, at most two given names). Never includes a function/pastoral name.
 */
export function civilName(p: {
  nom_affichage?: string | null;
  nom?: string | null;
  prenoms?: string | null;
}): string {
  const server = (p.nom_affichage ?? "").trim();
  if (server) return server;
  const parts = [...prenomsList(p.prenoms).slice(0, 2), famUpper(p.nom)].filter(Boolean);
  return parts.join(" ");
}

/** Full civil name (ALL given names + family name) for the detailed file, never
 * capped and never a function. */
export function civilNameComplet(p: { nom?: string | null; prenoms?: string | null }): string {
  return [...prenomsList(p.prenoms), famUpper(p.nom)].filter(Boolean).join(" ");
}

// Backwards-compatible alias: historical callers passed { titre, prenoms, nom };
// the title is now deliberately ignored so a function can never pollute the name.
export const displayName = civilName;

/** The function label with its scope, for the dedicated function zone. */
export function fonctionLabel(p: { titre?: string | null; fonction_perimetre?: string | null }): string | null {
  const titre = (p.titre ?? "").trim();
  if (!titre) return null;
  const perimetre = (p.fonction_perimetre ?? "").trim();
  return perimetre ? `${titre} - ${perimetre}` : titre;
}

// Two-letter initials for the avatar fallback, from the given name and family
// name only (never the function), so the honorific title never leaks in.
export function initials(p: { prenoms?: string | null; nom?: string | null }): string {
  const first = (p.prenoms ?? "").trim();
  const last = (p.nom ?? "").trim();
  const letters = [first, last]
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return letters || "?";
}
