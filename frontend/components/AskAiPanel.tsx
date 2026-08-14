"use client";

import { useState } from "react";

import { ApiError, requestAIReading } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { AIReadingResult, Language } from "@/lib/types";
import ConsentGate from "./ConsentGate";
import ReadingCard from "./ReadingCard";

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
  const copy = t(language);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AIReadingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsentGate, setShowConsentGate] = useState(false);

  async function submit() {
    const trimmed = question.trim();
    if (!trimmed) return;
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
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5 sm:p-6 space-y-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted">{description}</p>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          placeholder={
            domain === "zodiac" ? copy.askPlaceholderZodiac : copy.askPlaceholderNumerology
          }
          className="input-field w-full p-3 text-sm"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading || !question.trim()}
          className="btn-primary px-5 py-2.5 text-sm"
        >
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
