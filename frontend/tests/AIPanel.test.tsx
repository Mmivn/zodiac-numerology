import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import AIPanel from "@/components/AIPanel";
import type { TranslatableEntry } from "@/lib/useLanguageSyncedReading";
import type { AIReadingResult } from "@/lib/types";

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function readingFor(text: string): AIReadingResult {
  return {
    text,
    provider: "gemini",
    model: "gemini-flash-latest",
    fallback_count: 0,
    cached: false,
    used_paid_provider: false,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// Regression coverage for: "an AI reading is displayed, the user
// switches UI language, and the reading stays in the old language until
// the button is clicked again." AIPanel (and AskAiPanel/
// CompatibilityPanel) must instead *translate* the existing reading
// automatically — via POST /translate, never a second POST /ai-reading
// — and cache the translation per language so switching back is
// instant. See lib/useLanguageSyncedReading.ts.
describe("AIPanel language switching", () => {
  it("translates the existing reading into the new language automatically, without a second full generation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(readingFor("Русский текст расклада.")))
      .mockResolvedValueOnce(jsonResponse(readingFor("Nội dung tiếng Việt.")));
    vi.stubGlobal("fetch", fetchMock);

    const cache = new Map<string, TranslatableEntry>();
    const baseProps = {
      domain: "zodiac" as const,
      kind: "my_sign" as const,
      signature: "taurus",
      title: "My sign",
      description: "desc",
      buttonLabel: "Get reading",
      name: "Anna",
      birthDate: "1990-05-20",
      consent: true,
      onConsentChange: () => {},
      cache,
    };

    const { rerender } = render(<AIPanel {...baseProps} language="ru" />);

    await userEvent.click(screen.getByRole("button", { name: "Get reading" }));
    await waitFor(() => expect(screen.getByText("Русский текст расклада.")).toBeInTheDocument());

    // Simulate the parent switching UI language — same component
    // instance, no remount (AIPanel is no longer keyed on language).
    rerender(<AIPanel {...baseProps} language="vi" />);

    // The Russian reading is replaced by the translated Vietnamese
    // text automatically, no button click required.
    await waitFor(() => expect(screen.getByText("Nội dung tiếng Việt.")).toBeInTheDocument());
    expect(screen.queryByText("Русский текст расклада.")).not.toBeInTheDocument();

    // Exactly one generation call and one translation call — never a
    // second full (paid) generation just from switching language.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [translateUrl, translateInit] = fetchMock.mock.calls[1];
    expect(String(translateUrl)).toContain("/translate");
    const translateBody = JSON.parse(translateInit.body);
    expect(translateBody).toEqual({
      text: "Русский текст расклада.",
      language: "vi",
      consent: true,
    });
  });

  it("shows the already-cached translation for a language switched back to, instead of re-translating", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(readingFor("English reading text.")))
      .mockResolvedValueOnce(jsonResponse(readingFor("Nội dung tiếng Việt.")));
    vi.stubGlobal("fetch", fetchMock);

    const cache = new Map<string, TranslatableEntry>();
    const baseProps = {
      domain: "zodiac" as const,
      kind: "my_sign" as const,
      signature: "taurus",
      title: "My sign",
      description: "desc",
      buttonLabel: "Get reading",
      name: "Anna",
      birthDate: "1990-05-20",
      consent: true,
      onConsentChange: () => {},
      cache,
    };

    const { rerender } = render(<AIPanel {...baseProps} language="en" />);
    await userEvent.click(screen.getByRole("button", { name: "Get reading" }));
    await waitFor(() => expect(screen.getByText("English reading text.")).toBeInTheDocument());

    // Switch to Vietnamese — translates and caches it.
    rerender(<AIPanel {...baseProps} language="vi" />);
    await waitFor(() => expect(screen.getByText("Nội dung tiếng Việt.")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Switch back to English — the original reading reappears from the
    // cache instantly, with no third network call.
    rerender(<AIPanel {...baseProps} language="en" />);
    expect(screen.getByText("English reading text.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("supports RU -> VI -> EN, translating fresh each time and caching every language visited", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(readingFor("EN текст.")))
      .mockResolvedValueOnce(jsonResponse(readingFor("RU текст.")))
      .mockResolvedValueOnce(jsonResponse(readingFor("VI текст.")));
    vi.stubGlobal("fetch", fetchMock);

    const cache = new Map<string, TranslatableEntry>();
    const baseProps = {
      domain: "zodiac" as const,
      kind: "my_sign" as const,
      signature: "taurus",
      title: "My sign",
      description: "desc",
      buttonLabel: "Get reading",
      name: "Anna",
      birthDate: "1990-05-20",
      consent: true,
      onConsentChange: () => {},
      cache,
    };

    const { rerender } = render(<AIPanel {...baseProps} language="en" />);
    await userEvent.click(screen.getByRole("button", { name: "Get reading" }));
    await waitFor(() => expect(screen.getByText("EN текст.")).toBeInTheDocument());

    rerender(<AIPanel {...baseProps} language="ru" />);
    await waitFor(() => expect(screen.getByText("RU текст.")).toBeInTheDocument());

    rerender(<AIPanel {...baseProps} language="vi" />);
    await waitFor(() => expect(screen.getByText("VI текст.")).toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 generation + 2 translations
  });

  it("never auto-translates before anything has ever been generated", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const cache = new Map<string, TranslatableEntry>();
    const { rerender } = render(
      <AIPanel
        domain="zodiac"
        kind="my_sign"
        signature="taurus"
        title="My sign"
        description="desc"
        buttonLabel="Get reading"
        name="Anna"
        birthDate="1990-05-20"
        language="en"
        consent={true}
        onConsentChange={() => {}}
        cache={cache}
      />
    );

    rerender(
      <AIPanel
        domain="zodiac"
        kind="my_sign"
        signature="taurus"
        title="My sign"
        description="desc"
        buttonLabel="Get reading"
        name="Anna"
        birthDate="1990-05-20"
        language="ru"
        consent={true}
        onConsentChange={() => {}}
        cache={cache}
      />
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the request payload with the currently selected language", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(readingFor("Nội dung tiếng Việt.")));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AIPanel
        domain="zodiac"
        kind="my_sign"
        signature="taurus"
        title="My sign"
        description="desc"
        buttonLabel="Get reading"
        name="Anna"
        birthDate="1990-05-20"
        language="vi"
        consent={true}
        onConsentChange={() => {}}
        cache={new Map<string, TranslatableEntry>()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Get reading" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.language).toBe("vi");
  });
});
