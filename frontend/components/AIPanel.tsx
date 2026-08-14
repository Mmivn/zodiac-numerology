"use client";

import { useRef, useState } from "react";

import { ApiError, requestAIReading } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { AIReadingResult, Language, NumerologyKind, ZodiacKind } from "@/lib/types";
import ConsentGate from "./ConsentGate";
import ReadingCard from "./ReadingCard";
import ReadingSkeleton from "./ReadingSkeleton";

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
  // The language bug this component must not have: `result` is local
  // state, and if this instance were reused across a language (or kind)
  // switch, a reading fetched in one language would keep displaying
  // verbatim after switching to another. Fixed at the call site
  // (ZodiacDashboard/NumerologyDashboard render `<AIPanel key={cacheKey}
  // .../>`) — React's own recommended way to reset all state when an
  // identity changes is a key, not an effect that calls setState (which
  // is also an anti-pattern the linter correctly flags: "you might not
  // need an effect" for state that's really just derived from props).
  // Keying on cacheKey means every prop this component's state could go
  // stale against — domain, kind, signature, language — forces a full,
  // clean remount, and the useState initializer below then naturally
  // pre-fills from the new language's cache entry if one exists.
  const [result, setResult] = useState<AIReadingResult | null>(cache.get(cacheKey)?.result ?? null);
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
          </p>
        </>
      )}
    </div>
  );
}
