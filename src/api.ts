// Thin client for the ADSUM API. The base URL is configurable so the app can
// point at the deployed API (https://adsum-api.vercel.app) or a local one.

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://adsum-api.vercel.app";

export interface Me {
  id: string;
  email: string;
  role: string;
  membre_id: string | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
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

export async function getMe(token: string): Promise<Me> {
  const res = await fetch(`${BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new ApiError("Session expiree", res.status);
  }
  return (await res.json()) as Me;
}

export function apiBaseUrl(): string {
  return BASE;
}
