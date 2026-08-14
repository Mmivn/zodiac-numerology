"use client";

import { useState } from "react";

import { ApiError, requestCompatibility } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { CompatibilityResult, Language } from "@/lib/types";
import ConsentGate from "./ConsentGate";
import ReadingCard from "./ReadingCard";

export default function CompatibilityPanel({
  domain,
  name,
  birthDate,
  language,
  consent,
  onConsentChange,
  title,
  description,
}: {
  domain: "zodiac" | "numerology";
  name: string;
  birthDate: string;
  language: Language;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  title: string;
  description: string;
}) {
  const copy = t(language);
  const [companionName, setCompanionName] = useState("");
  const [companionBirthDate, setCompanionBirthDate] = useState("");
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsentGate, setShowConsentGate] = useState(false);

  async function submit() {
    if (!companionName.trim() || !companionBirthDate.trim()) return;
    if (!consent) {
      setShowConsentGate(true);
      return;
    }
    setShowConsentGate(false);
    setLoading(true);
    setError(null);
    try {
      const reading = await requestCompatibility({
        domain,
        personA: { name, birthDate },
        personB: { name: companionName.trim(), birthDate: companionBirthDate.trim() },
        language,
        consent,
      });
      setResult(reading);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || copy.errorGeneric);
      } else {
        setError(copy.errorGeneric);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5 sm:p-6 space-y-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted">{description}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-muted block mb-1">{copy.companionName}</label>
            <input
              type="text"
              value={companionName}
              onChange={(event) => setCompanionName(event.target.value)}
              placeholder={copy.namePlaceholder}
              className="input-field w-full p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">{copy.companionBirthDate}</label>
            <input
              type="text"
              value={companionBirthDate}
              onChange={(event) => setCompanionBirthDate(event.target.value)}
              placeholder={copy.birthDatePlaceholder}
              className="input-field w-full p-2.5 text-sm"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={loading || !companionName.trim() || !companionBirthDate.trim()}
          className="btn-primary px-5 py-2.5 text-sm"
        >
          {loading ? copy.loadingReading : copy.getCompatibilityButton}
        </button>
      </div>

      {showConsentGate && !consent && (
        <ConsentGate
          language={language}
          checked={consent}
          onChange={(value) => {
            onConsentChange(value);
            if (value) setShowConsentGate(false);
          }}
        />
      )}

      {error && (
        <div className="rounded-xl border border-red/40 bg-red/10 p-4 text-sm text-red">{error}</div>
      )}

      {result && (
        <>
          <ReadingCard title={title} text={result.text} />
          <p className="text-xs text-muted px-1">
            {copy.poweredBy}: {result.provider} · {result.model}
            {result.fallback_count > 0 ? ` · fallback ×${result.fallback_count}` : ""}
          </p>
        </>
      )}
    </div>
  );
}
