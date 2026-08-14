"use client";

import { useRef, useState } from "react";

import { ApiError, requestCompatibility } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { CompatibilityResult, Language } from "@/lib/types";
import ConsentGate from "./ConsentGate";
import ReadingCard from "./ReadingCard";
import ReadingSkeleton from "./ReadingSkeleton";

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
  // See AskAiPanel.tsx for why this component must never keep showing a
  // stale-language result — fixed the same way, at the call site
  // (`<CompatibilityPanel key={language} .../>`), not with an effect.
  const copy = t(language);
  const [companionName, setCompanionName] = useState("");
  const [companionBirthDate, setCompanionBirthDate] = useState("");
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsentGate, setShowConsentGate] = useState(false);

  const inFlightRef = useRef(false);

  async function submit() {
    if (!companionName.trim() || !companionBirthDate.trim()) return;
    if (!consent) {
      setShowConsentGate(true);
      return;
    }
    if (inFlightRef.current) return;
    inFlightRef.current = true;
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
      inFlightRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card card-feature reveal p-6 sm:p-7 space-y-4">
        <div>
          <h3 className="font-display text-lg sm:text-xl text-foreground">{title}</h3>
          <p className="text-sm text-muted mt-1.5 leading-relaxed">{description}</p>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-2">
              {copy.companionName}
            </label>
            <input
              type="text"
              value={companionName}
              onChange={(event) => setCompanionName(event.target.value)}
              placeholder={copy.namePlaceholder}
              className="input-field w-full px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-2">
              {copy.companionBirthDate}
            </label>
            <input
              type="text"
              value={companionBirthDate}
              onChange={(event) => setCompanionBirthDate(event.target.value)}
              placeholder={copy.birthDatePlaceholder}
              className="input-field w-full px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={loading || !companionName.trim() || !companionBirthDate.trim()}
          className={"btn-primary px-6 py-3 text-sm inline-flex items-center gap-2" + (loading ? " is-loading" : "")}
        >
          {loading && (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          )}
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
        <div className="rounded-xl border border-red/30 bg-red/5 p-4 text-sm text-red">{error}</div>
      )}

      {loading && !result && <ReadingSkeleton />}

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
