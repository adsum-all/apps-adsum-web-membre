// Thin client for the ADSUM API. The base URL is configurable so the app can
// point at the deployed API (https://adsum-api.vercel.app) or a local one.

import { computePhash } from "./phash.js";

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
  nom_affichage: string;
  nom_naissance: string | null;
  nom_marital: string | null;
  nom_affiche: string | null;
  est_berger: boolean;
  nom_pastoral: string | null;
  nom_pastoral_affiche: string | null;
  fonction_perimetre: string | null;
  fonctions: { libelle: string; perimetre: string | null }[];
  telephone: string | null;
  indicatif_telephone: string | null;
  groupe: string | null;
  photo_url: string | null;
  photo_pending: boolean;
  photo_focus_x: number | null;
  photo_focus_y: number | null;
  statut: string;
  verifie: boolean;
  genre: string | null;
  date_naissance: string | null;
  naissance_annee_visible: boolean;
  pays: string | null;
  region: string | null;
  ville: string | null;
  adresse: string | null;
  adresse_complement: string | null;
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
  patriarche_biblique: string | null;
  coordination: string | null;
  coordinateur: string | null;
  champs_deverrouilles: string[];
  langue: string;
  titre?: string | null;
  fonction_cle?: string | null;
  fonction_confirmee: boolean;
  commission_id?: string | null;
  intendance_id?: string | null;
  tribu_id?: string | null;
  anniversaire_visible_annuaire: boolean;
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
  lien_session: string | null;
  liens: string[];
  mode?: string | null;
  type_diffusion: "embed" | "externe" | "aucun";
  visibilite: "public" | "membres" | "prive";
  cible_type?: "general" | "coordination" | "commission" | "intendance" | "tribu";
  cible_id?: string | null;
  cible_libelle?: string | null;
  phase: "a_venir" | "bientot" | "en_cours" | "termine";
  joignable: boolean;
  formulaire_ouvert: boolean;
}

export interface FonctionItem {
  cle: string;
  libelle_h: string;
  libelle_f: string;
  libelle_n: string;
  est_vip: boolean;
  ordre: number;
  actif: boolean;
}

export interface AnniversaireOut {
  id: string;
  prenoms: string;
  nom: string;
  photo_url: string | null;
  jour: number;
  mois: number;
  commission?: string | null;
  est_vip: boolean;
  titre?: string | null;
}

export type AnniversaireCategorie = "vip" | "responsables" | "commission";

export interface NotifPreferences {
  evenements: boolean;
  demandes: boolean;
  rappels: boolean;
  email: boolean;
  telegram: boolean;
  whatsapp: boolean;
  sms: boolean;
  anniversaire: boolean;
  anniv_pairs: boolean;
  cal_vip: boolean;
  cal_responsables: boolean;
  cal_commission: boolean;
}

export interface QuestionItem {
  id: string;
  libelle: string;
  type: string;
  options: string[];
}

export interface QuestionnaireMembre {
  disponible: boolean;
  deja_repondu?: boolean;
  fenetre_heures?: number;
  titre?: string;
  questions: QuestionItem[];
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

export interface ConsentSummary {
  cle: string;
  version: string;
  titre: string;
  bloquant: boolean;
  ordre: number;
}

export interface ConsentDoc {
  cle: string;
  version: string;
  titre: string;
  contenu: string;
}

export interface SignatureRef {
  cle: string;
  version: string;
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
    readonly detail?: unknown,
  ) {
    super(message);
  }
}

/** Read the JSON error body (FastAPI `detail`) without throwing on a non-JSON
 * response, so the caller can surface the precise reason for a 4xx. */
async function readDetail(res: Response): Promise<unknown> {
  try {
    const data = (await res.clone().json()) as { detail?: unknown };
    return data?.detail ?? data;
  } catch {
    return undefined;
  }
}

async function authedGet<T>(path: string, token: string, onError: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new ApiError(res.status === 401 ? "Session expirée" : onError, res.status);
  }
  return (await res.json()) as T;
}

export interface LoginResult {
  token: string;
  doitChangerMdp: boolean;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const message =
      res.status === 401
        ? "Identifiants invalides ou mot de passe temporaire expiré"
        : "Service indisponible";
    throw new ApiError(message, res.status);
  }
  const data = (await res.json()) as { access_token: string; doit_changer_mdp?: boolean };
  return { token: data.access_token, doitChangerMdp: Boolean(data.doit_changer_mdp) };
}

export async function premiereConnexion(
  email: string,
  mdpTemporaire: string,
  nouveauMdp: string,
  codeOtp: string,
): Promise<string> {
  const res = await fetch(`${BASE}/api/v1/auth/premiere-connexion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, mdp_temporaire: mdpTemporaire, nouveau_mdp: nouveauMdp, code_otp: codeOtp }),
  });
  if (!res.ok) {
    throw new ApiError(res.status === 400 ? "Code ou mot de passe invalide" : "Validation impossible", res.status);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export function getMe(token: string): Promise<Me> {
  return authedGet<Me>("/api/v1/auth/me", token, "Session expirée");
}

export function getMembreProfile(token: string): Promise<MembreProfile> {
  return authedGet<MembreProfile>("/api/v1/membres/me", token, "Profil indisponible");
}

export function getEvenements(token: string): Promise<EvenementOut[]> {
  return authedGet<EvenementOut[]>("/api/v1/membres/me/evenements", token, "Activités indisponibles");
}

export function getFonctions(token: string): Promise<FonctionItem[]> {
  return authedGet<FonctionItem[]>("/api/v1/fonctions", token, "Fonctions indisponibles");
}

export function getAnniversaires(
  token: string,
  params: { categorie: AnniversaireCategorie; mois?: number },
): Promise<AnniversaireOut[]> {
  const query = new URLSearchParams({ categorie: params.categorie });
  if (params.mois != null) query.set("mois", String(params.mois));
  return authedGet<AnniversaireOut[]>(
    `/api/v1/membres/anniversaires?${query.toString()}`,
    token,
    "Anniversaires indisponibles",
  );
}

export function setAnniversaireVisibilite(token: string, visible: boolean): Promise<{ ok: boolean }> {
  return authedPut("/api/v1/membres/me/anniversaire-visibilite", token, { visible }, "Mise à jour impossible");
}

export function getNotifPreferences(token: string): Promise<NotifPreferences> {
  return authedGet<NotifPreferences>("/api/v1/membres/me/preferences-notification", token, "Préférences indisponibles");
}

export function exportDonneesRGPD(token: string): Promise<Record<string, unknown>> {
  return authedGet<Record<string, unknown>>("/api/v1/membres/me/export", token, "Export impossible");
}

export function setLangue(token: string, langue: "fr" | "en"): Promise<{ ok: boolean; langue: string }> {
  return authedPut("/api/v1/membres/me/langue", token, { langue }, "Changement de langue impossible");
}

export function telegramLien(token: string): Promise<{ deep_link: string }> {
  return authedPost("/api/v1/membres/me/telegram/lien", token, {}, "Lien indisponible");
}

export function telegramVerifier(token: string): Promise<{ linked: boolean; message?: string }> {
  return authedPost("/api/v1/membres/me/telegram/verifier", token, {}, "Vérification impossible");
}

export function enregistrerWhatsapp(token: string, numero: string): Promise<{ ok: boolean }> {
  return authedPut("/api/v1/membres/me/whatsapp", token, { numero }, "Enregistrement impossible");
}

export function demanderSuppression(token: string): Promise<{ ok: boolean; demande_id?: string; deja_demandee?: boolean }> {
  return authedPost("/api/v1/membres/me/suppression", token, {}, "Demande impossible");
}

export function setNotifPreferences(token: string, prefs: NotifPreferences): Promise<NotifPreferences> {
  return authedPut<NotifPreferences>("/api/v1/membres/me/preferences-notification", token, prefs, "Mise à jour impossible");
}

export interface ParticipationMembre {
  statut: "present" | "partiel" | "absent" | null;
  source: "scan" | "declaration" | null;
  valide: boolean;
  avis: string | null;
  note: number | null;
  deja_scanne: boolean;
  verrouille: boolean;
  ouvert: boolean;
  disponible_le: string | null;
  /** True once the declaration window is over (server-enforced). */
  cloture?: boolean;
  /** End of the declaration window, so the form can show its deadline. */
  cloture_le?: string | null;
  /** presentiel (proven by scan or declared) or en_ligne (declared). */
  modalite?: "presentiel" | "en_ligne" | null;
}

export function getParticipation(token: string, eventId: string): Promise<ParticipationMembre> {
  return authedGet<ParticipationMembre>(`/api/v1/membres/me/evenements/${eventId}/participation`, token, "Participation indisponible");
}

export function declarerParticipation(
  token: string,
  eventId: string,
  body: { statut?: string; modalite?: "presentiel" | "en_ligne"; avis?: string; note?: number; valider?: boolean },
): Promise<{ ok: boolean; verrouille: boolean; statut: string; message?: string }> {
  return authedPut(`/api/v1/membres/me/evenements/${eventId}/participation`, token, body, "Envoi impossible");
}

export function getEventQuestionnaire(token: string, eventId: string): Promise<QuestionnaireMembre> {
  return authedGet<QuestionnaireMembre>(
    `/api/v1/membres/me/evenements/${eventId}/questionnaire`,
    token,
    "Questionnaire indisponible",
  );
}

export function submitQuestionnaire(token: string, eventId: string, reponses: Record<string, string>): Promise<{ ok: boolean }> {
  return authedPost<{ ok: boolean }>(
    `/api/v1/membres/me/evenements/${eventId}/questionnaire`,
    token,
    { reponses },
    "Envoi impossible",
  );
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

export function marquerNotificationLue(token: string, id: string): Promise<void> {
  return authedPost<void>(`/api/v1/membres/me/notifications/${id}/lire`, token, {}, "Marquage impossible");
}

export async function markNotificationsRead(token: string): Promise<void> {
  await fetch(`${BASE}/api/v1/membres/me/notifications/lire`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
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
    const detail = await readDetail(res);
    throw new ApiError(res.status === 400 ? "Requête invalide" : res.status === 401 ? "Session expirée" : onError, res.status, detail);
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
    throw new ApiError(res.status === 400 ? "Code ou requête invalide" : onError, res.status);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export function requestOtp(email: string, purpose: string): Promise<{ ok: boolean; sent: boolean; provider: string }> {
  return publicPost("/api/v1/auth/request-otp", { email, purpose }, "Envoi du code impossible");
}

export interface DemandeMessage {
  id: string;
  auteur_type: "membre" | "staff" | "systeme";
  auteur_nom: string | null;
  corps: string;
  cree_le: string | null;
  document_id?: string | null;
  /** Read receipts: when the member / the staff read this message. */
  lu_par_membre_le?: string | null;
  lu_par_staff_le?: string | null;
}

export interface Demande {
  id: string;
  numero: string;
  type: string;
  sujet: string;
  champ_concerne: string | null;
  statut: string;
  categorie?: string | null;
  sous_categorie?: string | null;
  motif_cloture?: string | null;
  cree_le: string | null;
  nb_messages: number;
  /** Step tracking: when the administration took the request over / closed it. */
  pris_en_charge_le?: string | null;
  clos_le?: string | null;
  /** Deadline for the member's action after an unlock (auto-close when over). */
  echeance_reponse?: string | null;
}

export interface CatalogueSous {
  cle: string;
  libelle: string;
  sujet: string;
  message: string;
  piece: string;
}

export interface CatalogueCategorie {
  categorie: string;
  libelle: string;
  sous: CatalogueSous[];
}

export interface DemandeCatalogue {
  categories: CatalogueCategorie[];
  statuts: Record<string, string>;
}

export function getDemandeCatalogue(token: string): Promise<DemandeCatalogue> {
  return authedGet<DemandeCatalogue>("/api/v1/membres/me/demandes/catalogue", token, "Catalogue indisponible");
}

export interface DemandeDetail extends Demande {
  messages: DemandeMessage[];
}

export function getDemandes(token: string): Promise<Demande[]> {
  return authedGet<Demande[]>("/api/v1/membres/me/demandes", token, "Demandes indisponibles");
}

export function getDemande(token: string, id: string): Promise<DemandeDetail> {
  return authedGet<DemandeDetail>(`/api/v1/membres/me/demandes/${id}`, token, "Demande indisponible");
}

export function createDemande(
  token: string,
  input: { type: string; sujet: string; champ_concerne?: string; message: string; categorie?: string; sous_categorie?: string },
): Promise<DemandeDetail> {
  return authedPost<DemandeDetail>("/api/v1/membres/me/demandes", token, input, "Création impossible");
}

export function sendDemandeMessage(token: string, id: string, corps: string, documentId?: string): Promise<DemandeMessage> {
  return authedPost<DemandeMessage>(
    `/api/v1/membres/me/demandes/${id}/messages`,
    token,
    documentId ? { corps, document_id: documentId } : { corps },
    "Envoi impossible",
  );
}

export function resetPassword(email: string, code: string, nouveau: string): Promise<void> {
  return publicPost<void>("/api/v1/auth/reset-password", { email, code, nouveau }, "Réinitialisation impossible");
}

export interface RefItem {
  id: string;
  nom: string;
  patriarche?: string | null;
  type_organisation?: string | null;
}

export function getReference(token: string, kind: string): Promise<RefItem[]> {
  return authedGet<RefItem[]>(`/api/v1/reference/${kind}`, token, "Liste indisponible");
}

export interface ProfilFields {
  prenoms?: string;
  nom?: string;
  telephone?: string;
  indicatif_telephone?: string;
  date_naissance?: string;
  naissance_annee_visible?: boolean;
  genre?: string;
  pays?: string;
  region?: string;
  ville?: string;
  adresse?: string;
  adresse_complement?: string;
  commission_id?: string;
  intendance_id?: string;
  tribu_id?: string;
  groupe?: string;
  profession?: string;
  niveau_etudes?: string;
  situation_matrimoniale?: string;
  type_mariage?: string;
  baptise?: boolean;
  confirme?: boolean;
  premiere_communion?: boolean;
  type_membre?: string;
  fonction_cle?: string;
}

async function authedPatch<T>(path: string, token: string, body: unknown, onError: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status === 401 ? "Session expirée" : onError, res.status);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

async function authedPut<T>(path: string, token: string, body: unknown, onError: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await readDetail(res);
    throw new ApiError(res.status === 401 ? "Session expirée" : onError, res.status, detail);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export function updateProfil(
  token: string,
  fields: ProfilFields,
): Promise<{ ok: boolean; pending_validation?: boolean; champs?: string[]; updated?: string[] }> {
  return authedPatch("/api/v1/membres/me/profil", token, fields, "Mise à jour impossible");
}

/** Single, unified submission of an admin-opened modification cycle: the edited
 * text fields and any staged replacement photo go together, once. The server
 * consumes the whole unlock and rejects any replay. */
export function soumettreModifications(
  token: string,
  champs: Record<string, string>,
  inclurePhoto: boolean,
): Promise<{ ok: boolean; pending_validation?: boolean; champs?: string[]; photo?: boolean }> {
  return authedPost(
    "/api/v1/membres/me/modifications/soumettre",
    token,
    { champs, inclure_photo: inclurePhoto },
    "Soumission impossible",
  );
}

/** Signed preview of a replacement photo staged but not yet validated. */
export function getPendingPhotoUrl(token: string): Promise<{ url: string | null }> {
  return authedGet("/api/v1/membres/me/photo/pending", token, "Aperçu indisponible");
}

export interface InscriptionStatut {
  statut: string;
  motif_refus: string | null;
  champs_a_corriger: string[];
  soumis_le: string | null;
  decision_le: string | null;
  verifie: boolean;
}

export function getInscription(token: string): Promise<InscriptionStatut> {
  return authedGet<InscriptionStatut>("/api/v1/membres/me/inscription", token, "Statut indisponible");
}

export function soumettreInscription(token: string): Promise<unknown> {
  return authedPost("/api/v1/membres/me/inscription/soumettre", token, {}, "Soumission impossible");
}

interface SoumettreDetail {
  missing_fields?: string[];
  needs_document?: boolean;
  needs_signature?: boolean;
}

function soumettreDetail(err: unknown): SoumettreDetail | null {
  if (!(err instanceof ApiError) || err.status !== 422) return null;
  const d = err.detail;
  return d && typeof d === "object" ? (d as SoumettreDetail) : {};
}

/** True only when a soumettreInscription 422 was actually about the signature,
 * not a missing field or document. Falls back to true when the server sends a
 * 422 without a structured body (older API), so signature stays the safe guess. */
export function isNeedsSignature(err: unknown): boolean {
  const d = soumettreDetail(err);
  if (!d) return false;
  if (d.needs_signature === true) return true;
  // Structured body present but signature not the cause: not a signature issue.
  if (d.needs_signature === false) return false;
  // No structured body at all (empty object): keep the previous safe default.
  return Object.keys(d).length === 0;
}

/** Field labels for the human-readable message on a soumettre 422. */
const FIELD_LABELS: Record<string, string> = {
  prenoms: "Prénoms",
  nom: "Nom",
  telephone: "Téléphone",
  date_naissance: "Date de naissance",
  genre: "Genre",
  ville: "Ville",
  pays: "Pays",
  commission_id: "Commission",
  tribu_id: "Tribu",
};

/** Precise French reason for a failed soumettreInscription, or null if the
 * error is not a structured 422 (caller shows a generic message then). */
export function soumettreReason(err: unknown): string | null {
  const d = soumettreDetail(err);
  if (!d) return null;
  const missing = Array.isArray(d.missing_fields) ? d.missing_fields : [];
  if (missing.length > 0) {
    const labels = missing.map((k) => FIELD_LABELS[k] ?? k).join(", ");
    return `Ces champs sont encore incomplets : ${labels}.`;
  }
  if (d.needs_document === true) {
    return "Une pièce d'identité est requise avant l'envoi.";
  }
  if (d.needs_signature === true) {
    return null; // handled by the signature flow, not a message
  }
  return null;
}

export function getConsentDocs(token: string): Promise<ConsentSummary[]> {
  return authedGet<ConsentSummary[]>("/api/v1/consentements", token, "Documents indisponibles");
}

export function getConsentDoc(token: string, cle: string): Promise<ConsentDoc> {
  return authedGet<ConsentDoc>(
    `/api/v1/consentements/${encodeURIComponent(cle)}`,
    token,
    "Document indisponible",
  );
}

export interface DemanderSignatureResult {
  ok: boolean;
  canaux: string[];
  signature_id: string;
}

export function demanderSignature(
  token: string,
  documents: SignatureRef[],
): Promise<DemanderSignatureResult> {
  return authedPost<DemanderSignatureResult>(
    "/api/v1/consentements/signature/demander",
    token,
    { documents },
    "Envoi du code impossible",
  );
}

export function verifierSignature(token: string, code: string): Promise<{ ok: true }> {
  return authedPost<{ ok: true }>(
    "/api/v1/consentements/signature/verifier",
    token,
    { code },
    "Code invalide",
  );
}

export function getSignatureEtat(token: string): Promise<{ signe: boolean }> {
  return authedGet<{ signe: boolean }>(
    "/api/v1/consentements/signature/etat",
    token,
    "État indisponible",
  );
}

/** Upload a file to a private bucket via a server-issued signed URL, return the stored path. */
async function uploadViaSignedUrl(uploadUrl: string, file: File): Promise<void> {
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream", "x-upsert": "true" },
    body: file,
  });
  if (!put.ok) throw new ApiError("Téléversement impossible", put.status);
}

export async function uploadPhoto(
  token: string,
  file: File,
  focus?: { x: number; y: number },
): Promise<void> {
  const signed = await authedPost<{ upload_url: string; path: string }>(
    "/api/v1/membres/me/photo/upload-url",
    token,
    {},
    "Upload indisponible",
  );
  await uploadViaSignedUrl(signed.upload_url, file);
  // Compute the perceptual hash locally for duplicate detection (no PII leaves
  // the device beyond the photo already uploaded). A failure must not block.
  const phash = await computePhash(file).catch(() => null);
  await authedPost<void>(
    "/api/v1/membres/me/photo/confirm",
    token,
    { path: signed.path, phash, focus_x: focus?.x ?? null, focus_y: focus?.y ?? null },
    "Confirmation impossible",
  );
}

/** Re-frame the current photo (display-only focal point, no re-validation). */
export function setPhotoFocus(token: string, x: number, y: number): Promise<void> {
  return authedPatch("/api/v1/membres/me/photo/focus", token, { x, y }, "Cadrage impossible");
}

/** CSS object-position for a member photo, from its stored focal point.
 * Falls back to the upper-centre default that suits head-and-shoulders photos. */
export function photoObjectPosition(p: { photo_focus_x: number | null; photo_focus_y: number | null } | null): string {
  const x = p?.photo_focus_x;
  const y = p?.photo_focus_y;
  return x != null && y != null ? `${x}% ${y}%` : "50% 30%";
}

export async function uploadDocument(token: string, type: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const signed = await authedPost<{ upload_url: string; path: string }>(
    "/api/v1/membres/me/documents/upload-url",
    token,
    { type, ext },
    "Upload indisponible",
  );
  await uploadViaSignedUrl(signed.upload_url, file);
  const res = await authedPost<{ id: string }>(
    "/api/v1/membres/me/documents/confirm",
    token,
    { type, path: signed.path, nom_fichier: file.name, mime: file.type },
    "Confirmation impossible",
  );
  return res.id;
}

export function getPhotoUrl(token: string): Promise<{ url: string | null }> {
  return authedGet<{ url: string | null }>("/api/v1/membres/me/photo", token, "Photo indisponible");
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
    throw new ApiError(res.status === 401 ? "Session expirée" : "Envoi impossible", res.status);
  }
}

export interface AttestationInfo {
  requise: boolean;
  statut: string;
  echeance: string | null;
  texte: string;
  /** DD/MM/YYYY date the signed scan was transmitted, once sent. */
  soumise_le?: string | null;
  /** Reason given by the administration when the scan was rejected. */
  motif_rejet?: string | null;
}

export function getAttestation(token: string): Promise<AttestationInfo> {
  return authedGet<AttestationInfo>("/api/v1/membres/me/attestation", token, "Attestation indisponible");
}

export function uploadAttestation(token: string, documentId: string): Promise<AttestationInfo> {
  return authedPost<AttestationInfo>(
    "/api/v1/membres/me/attestation/upload",
    token,
    { document_id: documentId },
    "Envoi impossible",
  );
}

export function apiBaseUrl(): string {
  return BASE;
}
