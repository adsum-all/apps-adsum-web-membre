// Thin client for the ADSUM API. The base URL is configurable so the app can
// point at the deployed API (https://adsum-api.vercel.app) or a local one.

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://adsum-api.vercel.app";

export interface Me {
  id: string;
  email: string;
  role: string;
  membre_id: string | null;
}

export interface MembreProfile {
  id: string;
  matricule: string;
  email: string;
  nom: string | null;
  prenoms: string | null;
  telephone: string | null;
  groupe: string | null;
  photo_url: string | null;
  statut: string;
  verifie: boolean;
  genre: string | null;
  date_naissance: string | null;
  pays: string | null;
  ville: string | null;
  date_entree: string | null;
  cheminement_pastoral: string | null;
  statut_administratif: string | null;
  type_membre: string | null;
  promotion: string | null;
  situation_matrimoniale: string | null;
  type_mariage: string | null;
  profession: string | null;
  niveau_etudes: string | null;
  baptise: boolean | null;
  confirme: boolean | null;
  premiere_communion: boolean | null;
  commission: string | null;
  intendance: string | null;
  berger: string | null;
  tribu: string | null;
  patriarche: string | null;
  coordination: string | null;
  coordinateur: string | null;
}

export interface EvenementOut {
  id: string;
  titre: string;
  type: string | null;
  volet: string;
  debut: string;
  fin: string | null;
  lieu: string | null;
  session_ouverte: boolean;
}

export interface PresenceOut {
  evenement_id: string;
  evenement_titre: string;
  debut: string | null;
  arrivee: string | null;
  depart: string | null;
  methode: string | null;
}

export interface QrToken {
  token: string;
  membre_id: string;
  issued_at: string;
  expires_at: string;
  key_version: number;
}

export interface Recensement {
  id: string;
  annee: number;
  statut: string;
  ouvert: boolean;
  deja_repondu: boolean;
}

export interface DocumentItem {
  id: string;
  type: string | null;
  statut: string;
  demande_le: string | null;
  recu_le: string | null;
  traite_le: string | null;
}

export interface EngagementItem {
  id: string;
  type: string | null;
  version: string;
  signe: boolean;
  signe_le: string | null;
}

export interface NotificationItem {
  id: string;
  type: string | null;
  titre: string | null;
  corps: string | null;
  lu: boolean;
  cree_le: string | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function authedGet<T>(path: string, token: string, onError: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new ApiError(res.status === 401 ? "Session expiree" : onError, res.status);
  }
  return (await res.json()) as T;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new ApiError(res.status === 401 ? "Identifiants invalides" : "Service indisponible", res.status);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export function getMe(token: string): Promise<Me> {
  return authedGet<Me>("/api/v1/auth/me", token, "Session expiree");
}

export function getMembreProfile(token: string): Promise<MembreProfile> {
  return authedGet<MembreProfile>("/api/v1/membres/me", token, "Profil indisponible");
}

export function getEvenements(token: string): Promise<EvenementOut[]> {
  return authedGet<EvenementOut[]>("/api/v1/membres/me/evenements", token, "Activites indisponibles");
}

export function getHistorique(token: string): Promise<PresenceOut[]> {
  return authedGet<PresenceOut[]>("/api/v1/membres/me/historique", token, "Historique indisponible");
}

export function getQrToken(token: string): Promise<QrToken> {
  return authedGet<QrToken>("/api/v1/membres/me/qr", token, "QR indisponible");
}

export function getNotifications(token: string): Promise<NotificationItem[]> {
  return authedGet<NotificationItem[]>("/api/v1/membres/me/notifications", token, "Notifications indisponibles");
}

export function getRecensement(token: string): Promise<Recensement | null> {
  return authedGet<Recensement | null>("/api/v1/membres/me/recensement", token, "Recensement indisponible");
}

export function getDocuments(token: string): Promise<DocumentItem[]> {
  return authedGet<DocumentItem[]>("/api/v1/membres/me/documents", token, "Dossier indisponible");
}

export function getEngagements(token: string): Promise<EngagementItem[]> {
  return authedGet<EngagementItem[]>("/api/v1/membres/me/engagements", token, "Engagements indisponibles");
}

async function authedPost<T>(path: string, token: string, body: unknown, onError: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status === 400 ? "Requete invalide" : res.status === 401 ? "Session expiree" : onError, res.status);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export function changePassword(token: string, ancien: string, nouveau: string): Promise<void> {
  return authedPost<void>("/api/v1/membres/me/change-password", token, { ancien, nouveau }, "Changement impossible");
}

export function acceptEngagement(token: string, type: string): Promise<EngagementItem> {
  return authedPost<EngagementItem>("/api/v1/membres/me/engagements/accepter", token, { type }, "Signature impossible");
}

export function submitDocument(token: string, type: string, libelle?: string): Promise<DocumentItem> {
  return authedPost<DocumentItem>("/api/v1/membres/me/documents", token, { type, libelle }, "Envoi impossible");
}

export function participer(token: string, evenementId: string, note?: number, commentaire?: string): Promise<void> {
  return authedPost<void>(
    "/api/v1/membres/me/participation",
    token,
    { evenement_id: evenementId, note, commentaire },
    "Validation impossible",
  );
}

async function publicPost<T>(path: string, body: unknown, onError: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status === 400 ? "Code ou requete invalide" : onError, res.status);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export function requestOtp(email: string, purpose: string): Promise<{ ok: boolean; sent: boolean; provider: string }> {
  return publicPost("/api/v1/auth/request-otp", { email, purpose }, "Envoi du code impossible");
}

export function resetPassword(email: string, code: string, nouveau: string): Promise<void> {
  return publicPost<void>("/api/v1/auth/reset-password", { email, code, nouveau }, "Reinitialisation impossible");
}

export async function submitRecensement(
  token: string,
  reponse: { confirme_engagement: boolean; infos_a_jour: boolean; reaccepte_engagements: boolean },
): Promise<void> {
  const res = await fetch(`${BASE}/api/v1/membres/me/recensement`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(reponse),
  });
  if (!res.ok) {
    throw new ApiError(res.status === 401 ? "Session expiree" : "Envoi impossible", res.status);
  }
}

export function apiBaseUrl(): string {
  return BASE;
}
