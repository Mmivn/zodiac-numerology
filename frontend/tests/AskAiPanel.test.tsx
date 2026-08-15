import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import AskAiPanel from "@/components/AskAiPanel";
import type { TranslatableEntry } from "@/lib/useLanguageSyncedReading";

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function readingFor(text: string) {
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

describe("AskAiPanel language switching", () => {
  it("translates the existing answer on a language switch, without re-asking the question", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(readingFor("English answer.")))
      .mockResolvedValueOnce(jsonResponse(readingFor("Câu trả lời tiếng Việt.")));
    vi.stubGlobal("fetch", fetchMock);

    const cache = new Map<string, TranslatableEntry>();
    const baseProps = {
      domain: "zodiac" as const,
      name: "Anna",
      birthDate: "1990-05-20",
      consent: true,
      onConsentChange: () => {},
      title: "Ask AI",
      description: "desc",
      cache,
    };

    const { rerender } = render(<AskAiPanel {...baseProps} language="en" />);

    await userEvent.type(screen.getByRole("textbox"), "What about love?");
    await userEvent.click(screen.getByRole("button", { name: /ask/i }));
    await waitFor(() => expect(screen.getByText("English answer.")).toBeInTheDocument());

    rerender(<AskAiPanel {...baseProps} language="vi" />);

    await waitFor(() =>
      expect(screen.getByText("Câu trả lời tiếng Việt.")).toBeInTheDocument()
    );
    expect(screen.queryByText("English answer.")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2); // 1 generation + 1 translation

    const [translateUrl] = fetchMock.mock.calls[1];
    expect(String(translateUrl)).toContain("/translate");
  });

  it("does not call the AI before a question has ever been submitted", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const cache = new Map<string, TranslatableEntry>();
    const { rerender } = render(
      <AskAiPanel
        domain="zodiac"
        name="Anna"
        birthDate="1990-05-20"
        language="en"
        consent={true}
        onConsentChange={() => {}}
        title="Ask AI"
        description="desc"
        cache={cache}
      />
    );

    rerender(
      <AskAiPanel
        domain="zodiac"
        name="Anna"
        birthDate="1990-05-20"
        language="ru"
        consent={true}
        onConsentChange={() => {}}
        title="Ask AI"
        description="desc"
        cache={cache}
      />
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
