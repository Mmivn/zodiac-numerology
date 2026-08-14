// Mirrors backend/schemas.py exactly — keep in sync by hand (small enough
// surface that a codegen step isn't worth it yet).

export type Language = "ru" | "en" | "vi";

export type ZodiacKind = "my_sign" | "today" | "month" | "year" | "ask_ai";
export type NumerologyKind =
  | "life_path"
  | "today"
  | "month"
  | "year"
  | "full_reading"
  | "ask_ai";

export interface Profile {
  name: string;
  birth_date: string; // ISO (YYYY-MM-DD)
  language: Language;
  zodiac_sign: string;
  zodiac_sign_name: string;
  life_path_number: number;
}

export interface NumerologyNumbers {
  life_path_number: number;
  personal_day_number: number;
  personal_month_number: number;
  personal_year_number: number;
}

export interface AIReadingResult {
  text: string;
  provider: string;
  model: string;
  fallback_count: number;
  cached: boolean;
  used_paid_provider: boolean;
}

export interface CompatibilityResult extends AIReadingResult {
  person_a_zodiac_sign: string | null;
  person_b_zodiac_sign: string | null;
  person_a_life_path_number: number | null;
  person_b_life_path_number: number | null;
}

export interface ApiErrorBody {
  detail: string;
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}
