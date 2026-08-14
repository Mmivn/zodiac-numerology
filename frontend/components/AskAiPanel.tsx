"use client";

import { useRef, useState } from "react";

import { ApiError, requestAIReading } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { AIReadingResult, Language } from "@/lib/types";
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
  // `result` (and `question`) are local state — this component must
  // never keep showing a previously-fetched answer after the UI
  // language changes. Fixed at the call site (ZodiacDashboard/
  // NumerologyDashboard render `<AskAiPanel key={language} .../>`),
  // which forces React to fully remount on a language switch rather
  // than reusing this instance — the officially-recommended way to
  // reset all state tied to a prop, versus an effect that calls
  // setState just to derive state from a prop (an anti-pattern the
  // linter itself flags). The one small tradeoff: an unsubmitted
  // draft question is cleared too, in exchange for it being
  // structurally impossible for a stale-language answer to leak through.
  const copy = t(language);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AIReadingResult | null>(null);
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
