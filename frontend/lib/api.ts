/**
 * The ONLY module in this frontend that talks to the backend. The browser
 * never calls Gemini/Groq/Mistral/Cloudflare/OpenAI/ALL_API directly, and
 * never sees a provider key — every AI call goes through the FastAPI
 * backend at NEXT_PUBLIC_API_URL.
 */
import type {
  AIReadingResult,
  CompatibilityResult,
  Language,
  NumerologyKind,
  NumerologyNumbers,
  Profile,
  ZodiacKind,
} from "./types";
import { ApiError } from "./types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status}).`;
    try {
      const data = await response.json();
      if (data?.detail) detail = String(data.detail);
    } catch {
      // ignore — non-JSON error body, keep the generic message
    }
    throw new ApiError(response.status, detail);
  }

  return response.json() as Promise<T>;
}

export async function fetchHealth(): Promise<{
  status: string;
  providers_configured: string[];
  provider_order: string[];
  paid_fallback_enabled: boolean;
}> {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) throw new ApiError(response.status, "Backend health check failed.");
  return response.json();
}

export function createProfile(
  name: string,
  birthDate: string,
  language: Language
): Promise<Profile> {
  return post<Profile>("/profile", { name, birth_date: birthDate, language });
}

export function fetchNumerology(
  birthDate: string,
  language: Language
): Promise<NumerologyNumbers> {
  return post<NumerologyNumbers>("/numerology", { birth_date: birthDate, language });
}

export function requestAIReading(params: {
  domain: "zodiac" | "numerology";
  kind: ZodiacKind | NumerologyKind;
  name: string;
  birthDate: string;
  language: Language;
  consent: boolean;
  question?: string;
}): Promise<AIReadingResult> {
  return post<AIReadingResult>("/ai-reading", {
    domain: params.domain,
    kind: params.kind,
    name: params.name,
    birth_date: params.birthDate,
    language: params.language,
    consent: params.consent,
    question: params.question,
  });
}

/**
 * Translate a reading already generated (see requestAIReading/
 * requestCompatibility) into another supported language — cheap
 * compared to a fresh reading, and used only to keep an
 * already-displayed reading in sync with the UI language. See
 * lib/useLanguageSyncedReading.ts.
 */
export function requestTranslation(params: {
  text: string;
  language: Language;
  consent: boolean;
}): Promise<AIReadingResult> {
  return post<AIReadingResult>("/translate", {
    text: params.text,
    language: params.language,
    consent: params.consent,
  });
}

export function requestCompatibility(params: {
  domain: "zodiac" | "numerology";
  personA: { name: string; birthDate: string };
  personB: { name: string; birthDate: string };
  language: Language;
  consent: boolean;
}): Promise<CompatibilityResult> {
  return post<CompatibilityResult>("/compatibility", {
    domain: params.domain,
    person_a: { name: params.personA.name, birth_date: params.personA.birthDate },
    person_b: { name: params.personB.name, birth_date: params.personB.birthDate },
    language: params.language,
    consent: params.consent,
  });
}

export { ApiError };
