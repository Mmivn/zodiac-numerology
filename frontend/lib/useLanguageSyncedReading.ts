"use client";

import { useEffect, useRef, useState } from "react";

import { requestTranslation } from "./api";
import type { AIReadingResult, Language } from "./types";

/**
 * One cache slot per canonical reading (a signature — e.g. a zodiac
 * sign, or "sign|action|date" — never the UI language, see AIPanel/
 * AskAiPanel/CompatibilityPanel for how each builds its cache key).
 * `byLanguage` accumulates a translation per language the user has
 * actually viewed this reading in, so switching back to any of them is
 * instant. `extra` carries fields that don't vary by language (e.g.
 * CompatibilityPanel's zodiac signs / life path numbers), merged onto
 * whichever language's AIReadingResult is being displayed — kept out of
 * `byLanguage` so this same entry shape works for every panel without a
 * generic type parameter.
 */
export interface TranslatableEntry {
  sourceLanguage: Language;
  byLanguage: Partial<Record<Language, AIReadingResult>>;
  extra?: Record<string, unknown>;
}

/**
 * Keeps whatever AI reading is on screen in sync with the current UI
 * language — no button click required, and never a second (paid)
 * reading generation just because the language changed:
 *
 *  - a translation already cached under `cacheKey` for `language` is
 *    shown instantly (derived straight from `cache` during render — no
 *    network call, no extra state);
 *  - otherwise, if a canonical reading already exists for `cacheKey`
 *    (in any language), an effect *translates* it — a cheap pass done
 *    once per (cacheKey, language) and written back onto the entry in
 *    `cache`, so switching back to a previously-seen language is
 *    instant too;
 *  - if nothing has ever been generated for `cacheKey` yet, this hook
 *    does nothing — generating the first reading stays the panel's own
 *    button, never triggered automatically here.
 *
 * `cacheKey` may be null (e.g. AskAiPanel/CompatibilityPanel before the
 * user's first submit, when there's nothing yet to key a cache entry
 * on) — the hook is simply inert until it becomes non-null.
 */
export function useLanguageSyncedReading(
  cache: Map<string, TranslatableEntry>,
  cacheKey: string | null,
  language: Language,
  consent: boolean
) {
  const entry = cacheKey ? cache.get(cacheKey) : undefined;
  // The reading to show is always derived straight from `cache` during
  // render, never stored in its own state — the only state this hook
  // owns is `translating` (a real in-progress flag) and this rerender
  // tick, bumped after the effect below mutates an entry already in
  // `cache` in place (mutating it doesn't itself trigger a re-render).
  const result = entry?.byLanguage[language] ?? null;
  const [translating, setTranslating] = useState(false);
  const [, bump] = useState(0);
  // Guards against a stale response winning a race: if the language
  // changes again (RU -> VI -> EN) before the RU -> VI translation
  // request returns, that response must not overwrite the newer one.
  const requestRef = useRef(0);

  useEffect(() => {
    if (!entry) return;
    if (entry.byLanguage[language]) return; // already have this language, nothing to do

    // No cached translation and no consent to call the AI — leave
    // whatever was last shown (a different language) rather than
    // blanking it.
    if (!consent) return;

    const sourceText = entry.byLanguage[entry.sourceLanguage]?.text;
    if (!sourceText) return;

    const requestId = ++requestRef.current;
    // Fetching data in response to a prop change (here, `language`) is
    // exactly the effect use case React's own docs endorse — this is
    // the loading flag for that fetch, set synchronously right before
    // it starts, same as any other "fetch on prop change" effect. The
    // linter's blanket rule doesn't carve out this canonical case; see
    // app/page.tsx's `hydrated` effect for the same kind of disable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTranslating(true);
    requestTranslation({ text: sourceText, language, consent })
      .then((translated) => {
        if (requestRef.current !== requestId) return; // superseded by a later switch
        entry.byLanguage[language] = translated;
        bump((n) => n + 1);
      })
      .catch(() => {
        // A failed translation shouldn't blank out a perfectly good
        // reading — the previous language's text just stays on screen.
      })
      .finally(() => {
        if (requestRef.current === requestId) setTranslating(false);
      });
  }, [cache, cacheKey, entry, language, consent]);

  // Called by a panel right after its own "generate" success handler
  // has already written the fresh reading into `cache` — this just
  // forces the rerender that picks it up (the value itself is read back
  // out of `cache`, not stored here, so there is only one source of
  // truth for "what's the current reading").
  function refresh() {
    bump((n) => n + 1);
  }

  return { result, translating, refresh } as const;
}
