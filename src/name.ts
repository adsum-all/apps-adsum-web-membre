// Display the member's name with an optional honorific title in front. The
// title is only set server-side once an administrator has confirmed the
// member's honorific function, so we simply render whatever the API returns.

export function displayName(p: {
  titre?: string | null;
  prenoms?: string | null;
  nom?: string | null;
}): string {
  return [p.titre, p.prenoms, p.nom].filter(Boolean).join(" ");
}

// Two-letter initials used as a fallback avatar when a member has no photo.
// Built from the first name and last name only (the honorific title is skipped
// so it never leaks into the avatar). Falls back to a single character or a
// neutral placeholder when the parts are empty.
export function initials(p: { prenoms?: string | null; nom?: string | null }): string {
  const first = (p.prenoms ?? "").trim();
  const last = (p.nom ?? "").trim();
  const letters = [first, last]
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return letters || "?";
}
