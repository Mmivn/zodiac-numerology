"use client";

import { useRef, useState } from "react";

import { ApiError, requestAIReading } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useLanguageSyncedReading, type TranslatableEntry } from "@/lib/useLanguageSyncedReading";
import type { Language } from "@/lib/types";
import ConsentGate from "./ConsentGate";
import ReadingCard from "./ReadingCard";
import ReadingSkeleton from "./ReadingSkeleton";

export default function AskAiPanel({
  domain,
  name,
  birthDate,
  language,
  consent,
  onConsentChange,
  title,
  description,
  cache,
}: {
  domain: "zodiac" | "numerology";
  name: string;
  birthDate: string;
  language: Language;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  title: string;
  description: string;
  /** Shared with AIPanel/CompatibilityPanel — see
   * lib/useLanguageSyncedReading.ts. Keyed on the last *submitted*
   * question so a language switch translates the existing answer
   * instead of losing it. */
  cache: Map<string, TranslatableEntry>;
}) {
  const copy = t(language);
  const [question, setQuestion] = useState("");
  // The signature of the last *submitted* question, kept separate from
  // the live textarea value — editing a fresh draft after getting an
  // answer must not change which cache entry a language switch resolves
  // against (or make it look like there's a new answer to translate).
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const cacheKey = lastQuestion ? `${domain}:ask_ai:${lastQuestion}` : null;
  const { result, translating, refresh } = useLanguageSyncedReading(cache, cacheKey, language, consent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsentGate, setShowConsentGate] = useState(false);

  const inFlightRef = useRef(false);

  async function submit() {
    const trimmed = question.trim();
    if (!trimmed) return;
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
        kind: "ask_ai",
        name,
        birthDate,
        language,
        consent,
        question: trimmed,
      });
      cache.set(`${domain}:ask_ai:${trimmed}`, {
        sourceLanguage: language,
        byLanguage: { [language]: reading },
      });
      setLastQuestion(trimmed);
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
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          placeholder={
            domain === "zodiac" ? copy.askPlaceholderZodiac : copy.askPlaceholderNumerology
          }
          className="input-field w-full p-3.5 text-sm resize-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading || !question.trim()}
          className={"btn-primary px-6 py-3 text-sm inline-flex items-center gap-2" + (loading ? " is-loading" : "")}
        >
          {loading && (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          )}
          {loading ? copy.loadingReading : copy.askButton}
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

      {(loading || translating) && !result && <ReadingSkeleton />}

      {result && (
        <>
          <ReadingCard title={title} text={result.text} />
          <p className="text-xs text-muted px-1">
            {copy.poweredBy}: {result.provider} · {result.model}
            {result.fallback_count > 0 ? ` · fallback ×${result.fallback_count}` : ""}
            {translating ? ` · ${copy.translatingReading}` : ""}
          </p>
        </>
      )}
    </div>
  );
}
