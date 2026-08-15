"use client";

import { useRef, useState } from "react";

import { ApiError, requestAIReading } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useLanguageSyncedReading, type TranslatableEntry } from "@/lib/useLanguageSyncedReading";
import type { Language, NumerologyKind, ZodiacKind } from "@/lib/types";
import ConsentGate from "./ConsentGate";
import ReadingCard from "./ReadingCard";
import ReadingSkeleton from "./ReadingSkeleton";

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
  /** Shared across panels — one entry per (domain, kind, signature),
   * deliberately never keyed on language: a language switch translates
   * the existing entry (see useLanguageSyncedReading) instead of losing
   * it. Switching tabs/actions and back still shows an already-fetched
   * reading in whichever language is current without a re-fetch. */
  cache: Map<string, TranslatableEntry>;
}) {
  const copy = t(language);
  const cacheKey = `${domain}:${kind}:${signature}`;
  const { result, translating, refresh } = useLanguageSyncedReading(cache, cacheKey, language, consent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsentGate, setShowConsentGate] = useState(false);

  // Belt-and-suspenders against a duplicate in-flight request: `loading`
  // is state, read from a per-render closure, so two clicks landing in
  // the same tick (before React re-renders the disabled button) could
  // both pass an `if (loading) return` check. A ref updates immediately,
  // synchronously, so the second click always sees the first one's flag.
  const inFlightRef = useRef(false);

  async function runReading() {
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
      const reading = await requestAIReading({
        domain,
        kind,
        name,
        birthDate,
        language,
        consent,
      });
      // A fresh generation becomes the new canonical reading — any
      // translations cached under the old canonical text no longer
      // match, so this replaces the entry rather than merging into it.
      cache.set(cacheKey, { sourceLanguage: language, byLanguage: { [language]: reading } });
      refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 503) setError(copy.serviceUnavailable);
        else if (err.status === 502) setError(copy.emptyResponse);
        else setError(err.detail || copy.errorGeneric);
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
        <button
          type="button"
          onClick={runReading}
          disabled={loading}
          className={"btn-primary px-6 py-3 text-sm inline-flex items-center gap-2" + (loading ? " is-loading" : "")}
        >
          {loading && (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          )}
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
        <div className="rounded-xl border border-red/30 bg-red/5 p-4 text-sm text-red">{error}</div>
      )}

      {loading && !result && <ReadingSkeleton />}

      {result && (
        <>
          <ReadingCard title={title} text={result.text} subtitle={subtitle} />
          <p className="text-xs text-muted px-1">
            {copy.poweredBy}: {result.provider} · {result.model}
            {result.fallback_count > 0 ? ` · fallback ×${result.fallback_count}` : ""}
            {result.cached ? " · cached" : ""}
            {translating ? ` · ${copy.translatingReading}` : ""}
          </p>
        </>
      )}
    </div>
  );
}
