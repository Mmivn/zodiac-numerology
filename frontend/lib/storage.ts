// Client-side profile/consent persistence. The backend is stateless (see
// backend/main.py's module docstring) — the browser is the source of
// truth for "who is this" and "did they consent", sent with every
// request that needs them. Wrapped in try/catch: private-browsing modes
// and some embedded webviews throw on localStorage access.
import type { Language, Profile } from "./types";

const PROFILE_KEY = "zodiac-numerology:profile";
const CONSENT_KEY = "zodiac-numerology:consent";
const LANGUAGE_KEY = "zodiac-numerology:language";

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile | null): void {
  try {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    else localStorage.removeItem(PROFILE_KEY);
  } catch {
    // ignore — storage unavailable, profile just won't survive a reload
  }
}

export function loadConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveConsent(consent: boolean): void {
  try {
    localStorage.setItem(CONSENT_KEY, consent ? "true" : "false");
  } catch {
    // ignore
  }
}

export function loadLanguage(): Language {
  try {
    const raw = localStorage.getItem(LANGUAGE_KEY);
    if (raw === "ru" || raw === "en" || raw === "vi") return raw;
  } catch {
    // ignore
  }
  return "en";
}

export function saveLanguage(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // ignore
  }
}
