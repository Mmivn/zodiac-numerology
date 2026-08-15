import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import CompatibilityPanel from "@/components/CompatibilityPanel";
import type { TranslatableEntry } from "@/lib/useLanguageSyncedReading";

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function compatibilityFor(text: string) {
  return {
    text,
    provider: "gemini",
    model: "gemini-flash-latest",
    fallback_count: 0,
    cached: false,
    used_paid_provider: false,
    person_a_zodiac_sign: "taurus",
    person_b_zodiac_sign: "libra",
    person_a_life_path_number: null,
    person_b_life_path_number: null,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CompatibilityPanel language switching", () => {
  it("translates the existing compatibility reading on a language switch, without re-submitting", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(compatibilityFor("English compatibility text.")))
      .mockResolvedValueOnce(jsonResponse(compatibilityFor("Nội dung tương hợp.")));
    vi.stubGlobal("fetch", fetchMock);

    const cache = new Map<string, TranslatableEntry>();
    const baseProps = {
      domain: "zodiac" as const,
      name: "Anna",
      birthDate: "1990-05-20",
      consent: true,
      onConsentChange: () => {},
      title: "Compatibility",
      description: "desc",
      cache,
    };

    const { rerender } = render(<CompatibilityPanel {...baseProps} language="en" />);

    await userEvent.type(screen.getByPlaceholderText("e.g. Anna"), "Ivan");
    await userEvent.type(screen.getByPlaceholderText("DD.MM.YYYY"), "10.10.1998");
    await userEvent.click(screen.getByRole("button", { name: /compatibility/i }));
    await waitFor(() =>
      expect(screen.getByText("English compatibility text.")).toBeInTheDocument()
    );

    rerender(<CompatibilityPanel {...baseProps} language="vi" />);

    await waitFor(() => expect(screen.getByText("Nội dung tương hợp.")).toBeInTheDocument());
    expect(screen.queryByText("English compatibility text.")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2); // 1 generation + 1 translation, never a 2nd generation

    const [translateUrl] = fetchMock.mock.calls[1];
    expect(String(translateUrl)).toContain("/translate");
  });

  it("does not call the AI at all before a compatibility result has ever been generated", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const cache = new Map<string, TranslatableEntry>();
    const { rerender } = render(
      <CompatibilityPanel
        domain="zodiac"
        name="Anna"
        birthDate="1990-05-20"
        language="en"
        consent={true}
        onConsentChange={() => {}}
        title="Compatibility"
        description="desc"
        cache={cache}
      />
    );

    rerender(
      <CompatibilityPanel
        domain="zodiac"
        name="Anna"
        birthDate="1990-05-20"
        language="ru"
        consent={true}
        onConsentChange={() => {}}
        title="Compatibility"
        description="desc"
        cache={cache}
      />
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
