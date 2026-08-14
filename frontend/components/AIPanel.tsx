"use client";

import { useState } from "react";

import { ApiError, requestAIReading } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { AIReadingResult, Language, NumerologyKind, ZodiacKind } from "@/lib/types";
import ConsentGate from "./ConsentGate";
import ReadingCard from "./ReadingCard";

interface CacheEntry {
  result: AIReadingResult;
}

export default function AIPanel({
  domain,
  kind,
  signature,
  title,
  description,
  buttonLabel,
  subtitle,
  name,
  birthDate,
  language,
  consent,
  onConsentChange,
  cache,
}: {
  domain: "zodiac" | "numerology";
  kind: ZodiacKind | NumerologyKind;
  signature: string;
  title: string;
  description: string;
  buttonLabel: string;
  subtitle?: string;
  name: string;
  birthDate: string;
  language: Language;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  /** Shared across panels so switching tabs/actions doesn't re-fetch an
   * already-generated reading for the same (domain, kind, signature,
   * language) combination this session. */
  cache: Map<string, CacheEntry>;
}) {
  const copy = t(language);
  const cacheKey = `${domain}:${kind}:${signature}:${language}`;
  const [result, setResult] = useState<AIReadingResult | null>(cache.get(cacheKey)?.result ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsentGate, setShowConsentGate] = useState(false);

  async function runReading() {
    if (!consent) {
      setShowConsentGate(true);
      return;
    }
    setShowConsentGate(false);
    setLoading(true);
    setError(null);
    try {
      const reading = await requestAIReading({
        domain,
        kind,
        name,
        birthDate,
        language,
        consent,
      });
      cache.set(cacheKey, { result: reading });
      setResult(reading);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 503) setError(copy.serviceUnavailable);
        else if (err.status === 502) setError(copy.emptyResponse);
        else setError(err.detail || copy.errorGeneric);
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
        <button
          type="button"
          onClick={runReading}
          disabled={loading}
          className="btn-primary px-5 py-2.5 text-sm"
        >
          {loading ? copy.loadingReading : buttonLabel}
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
          <ReadingCard title={title} text={result.text} subtitle={subtitle} />
          <p className="text-xs text-muted px-1">
            {copy.poweredBy}: {result.provider} · {result.model}
            {result.fallback_count > 0 ? ` · fallback ×${result.fallback_count}` : ""}
            {result.cached ? " · cached" : ""}
          </p>
        </>
      )}
    </div>
  );
}
