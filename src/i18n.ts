import { createContext, useContext } from "react";

export type Lang = "fr" | "en";

// Central FR/EN dictionary. Keys are stable; add entries as screens are localized.
const DICT: Record<string, { fr: string; en: string }> = {
  "nav.carte": { fr: "Ma carte", en: "My card" },
  "nav.activites": { fr: "Activités", en: "Activities" },
  "nav.historique": { fr: "Historique", en: "History" },
  "nav.profil": { fr: "Profil", en: "Profile" },

  "settings.title": { fr: "Paramètres & sécurité", en: "Settings & security" },
  "settings.account": { fr: "COMPTE", en: "ACCOUNT" },
  "settings.changePassword": { fr: "Changer le mot de passe", en: "Change password" },
  "settings.changePasswordHint": { fr: "Argon2, vérification de l'ancien", en: "Argon2, current password checked" },
  "settings.2fa": { fr: "Double authentification (2FA)", en: "Two-factor authentication (2FA)" },
  "settings.2faHint": { fr: "Code par e-mail à la connexion", en: "E-mail code at sign-in" },
  "settings.recommended": { fr: "Recommandé", en: "Recommended" },
  "settings.preferences": { fr: "PRÉFÉRENCES", en: "PREFERENCES" },
  "settings.notifications": { fr: "NOTIFICATIONS", en: "NOTIFICATIONS" },
  "settings.channels": { fr: "CANAUX DE RÉCEPTION", en: "DELIVERY CHANNELS" },
  "settings.data": { fr: "DONNÉES (RGPD)", en: "DATA (GDPR)" },
  "settings.export": { fr: "Exporter mes données", en: "Export my data" },
  "settings.exportHint": { fr: "Téléchargement immédiat (JSON)", en: "Immediate download (JSON)" },
  "settings.delete": { fr: "Demander la suppression", en: "Request deletion" },
  "settings.deleteHint": { fr: "Traitée par l'administration", en: "Handled by the administration" },
  "settings.logout": { fr: "Se déconnecter", en: "Sign out" },
  "settings.notifEvents": { fr: "Événements et formations", en: "Events and trainings" },
  "settings.notifRequests": { fr: "Suivi de mes demandes", en: "My requests updates" },
  "settings.notifReminders": { fr: "Rappels", en: "Reminders" },
  "settings.notifBirthday": { fr: "Souhaits d'anniversaire", en: "Birthday wishes" },
  "settings.notifEmail": { fr: "Recevoir aussi par e-mail", en: "Also receive by e-mail" },
  "settings.telegram": { fr: "Telegram", en: "Telegram" },
  "settings.telegramHint": { fr: "Gratuit. Recevez vos notifications sur Telegram.", en: "Free. Receive your notifications on Telegram." },
  "settings.link": { fr: "Lier", en: "Link" },
  "settings.linked": { fr: "Lié ✓", en: "Linked ✓" },
  "settings.whatsappAdd": { fr: "Ajouter", en: "Add" },
  "settings.whatsappEdit": { fr: "Modifier", en: "Edit" },

  "common.close": { fr: "Fermer", en: "Close" },
  "common.save": { fr: "Enregistrer", en: "Save" },
  "common.loading": { fr: "Chargement...", en: "Loading..." },
};

export function tr(lang: Lang, key: string): string {
  const entry = DICT[key];
  if (!entry) return key;
  return lang === "en" ? entry.en : entry.fr;
}

export const LangContext = createContext<Lang>("fr");

export function useLang(): Lang {
  return useContext(LangContext);
}

export function useT(): (key: string) => string {
  const lang = useLang();
  return (key: string) => tr(lang, key);
}
