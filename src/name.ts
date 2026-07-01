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
