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
  commission: string | null;
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

export function apiBaseUrl(): string {
  return BASE;
}
