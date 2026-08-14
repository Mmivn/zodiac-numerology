import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import AIPanel from "@/components/AIPanel";
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

// Regression test for the reported bug: "UI is Vietnamese, but the AI
// reading content is returned in Russian." Root cause was never a
// backend/prompt-language issue — it was this component (and
// AskAiPanel/CompatibilityPanel) continuing to display a previously
// fetched reading, in whatever language it was generated in, after the
// language prop changed. The fix is a `key={cacheKey}` at the call site
// (ZodiacDashboard/NumerologyDashboard) forcing a full remount — this
// test simulates exactly that by re-rendering with a new `key`.
describe("AIPanel language switching", () => {
  it("does not keep showing a reading fetched in a previous language after switching", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(readingFor("Русский текст расклада.")));
    vi.stubGlobal("fetch", fetchMock);

    const cache = new Map();
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

    const { rerender } = render(<AIPanel key="ru" {...baseProps} language="ru" />);

    await userEvent.click(screen.getByRole("button", { name: "Get reading" }));
    await waitFor(() => expect(screen.getByText("Русский текст расклада.")).toBeInTheDocument());

    // Simulate the parent switching language — same identity change the
    // real dashboards apply via `key={cacheKey}`.
    rerender(<AIPanel key="vi" {...baseProps} language="vi" />);

    // The stale Russian reading must be gone — remounting resets local
    // state, and no reading has been fetched yet for Vietnamese.
    expect(screen.queryByText("Русский текст расклада.")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1); // no wasted second call just from switching
  });

  it("shows the already-cached reading for a language switched back to, instead of re-fetching", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(readingFor("English reading text.")));
    vi.stubGlobal("fetch", fetchMock);

    const cache = new Map();
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

    const { rerender } = render(<AIPanel key="en" {...baseProps} language="en" />);
    await userEvent.click(screen.getByRole("button", { name: "Get reading" }));
    await waitFor(() => expect(screen.getByText("English reading text.")).toBeInTheDocument());

    // Switch away, then back — the English result should reappear from
    // the shared cache without a second network call.
    rerender(<AIPanel key="vi" {...baseProps} language="vi" />);
    expect(screen.queryByText("English reading text.")).not.toBeInTheDocument();

    rerender(<AIPanel key="en" {...baseProps} language="en" />);
    expect(screen.getByText("English reading text.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
        cache={new Map()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Get reading" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.language).toBe("vi");
  });
});
