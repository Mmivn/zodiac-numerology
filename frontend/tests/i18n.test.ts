import { describe, expect, it } from "vitest";

import { COPY, LANGUAGE_NAMES, SIGN_NAMES } from "@/lib/i18n";

const LANGUAGES = ["ru", "en", "vi"] as const;

function keysOf(obj: object): string[] {
  return Object.keys(obj).sort();
}

describe("i18n structural parity", () => {
  it("all three languages have the exact same top-level COPY keys", () => {
    const [first, ...rest] = LANGUAGES.map((lang) => keysOf(COPY[lang]));
    for (const keys of rest) {
      expect(keys).toEqual(first);
    }
  });

  it("all three languages have the same zodiac card keys", () => {
    const [first, ...rest] = LANGUAGES.map((lang) => keysOf(COPY[lang].zodiacCards));
    for (const keys of rest) expect(keys).toEqual(first);
  });

  it("all three languages have the same numerology card keys", () => {
    const [first, ...rest] = LANGUAGES.map((lang) => keysOf(COPY[lang].numerologyCards));
    for (const keys of rest) expect(keys).toEqual(first);
  });

  it("all three languages have all 12 zodiac sign names, non-empty", () => {
    const expectedSigns = [
      "aries", "taurus", "gemini", "cancer", "leo", "virgo",
      "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
    ];
    for (const lang of LANGUAGES) {
      expect(keysOf(SIGN_NAMES[lang]).sort()).toEqual([...expectedSigns].sort());
      for (const sign of expectedSigns) {
        expect(SIGN_NAMES[lang][sign]).toBeTruthy();
      }
    }
  });

  it("every language name is set", () => {
    for (const lang of LANGUAGES) {
      expect(LANGUAGE_NAMES[lang]).toBeTruthy();
    }
  });

  it("no COPY string is empty for any language", () => {
    for (const lang of LANGUAGES) {
      const copy = COPY[lang];
      for (const [key, value] of Object.entries(copy)) {
        if (typeof value === "string") {
          expect(value.length, `${lang}.${key}`).toBeGreaterThan(0);
        }
      }
    }
  });
});
