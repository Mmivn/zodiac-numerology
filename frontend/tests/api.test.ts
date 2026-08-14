import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, createProfile, requestAIReading, requestCompatibility } from "@/lib/api";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createProfile", () => {
  it("posts to /profile with the expected body and returns the parsed profile", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        name: "Anna",
        birth_date: "1990-05-20",
        language: "en",
        zodiac_sign: "taurus",
        zodiac_sign_name: "Taurus",
        life_path_number: 8,
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const profile = await createProfile("Anna", "20.05.1990", "en");

    expect(profile.zodiac_sign).toBe("taurus");
    expect(profile.life_path_number).toBe(8);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/profile");
    expect(JSON.parse(init.body)).toEqual({
      name: "Anna",
      birth_date: "20.05.1990",
      language: "en",
    });
  });

  it("surfaces the backend's detail message as an ApiError on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "Invalid birth date." }, 422))
    );

    await expect(createProfile("Anna", "not-a-date", "en")).rejects.toMatchObject(
      new ApiError(422, "Invalid birth date.")
    );
  });

  it("wraps a network failure in an ApiError instead of throwing raw", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );

    await expect(createProfile("Anna", "20.05.1990", "en")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("requestAIReading", () => {
  it("never sends consent=false silently as true — passes it through exactly", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ detail: "Consent is required." }, 403));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestAIReading({
        domain: "zodiac",
        kind: "my_sign",
        name: "Anna",
        birthDate: "20.05.1990",
        language: "en",
        consent: false,
      })
    ).rejects.toMatchObject({ status: 403 });

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body).consent).toBe(false);
  });

  it("returns provider/model/fallback_count from a successful reading", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          text: "A reading.",
          provider: "groq",
          model: "openai/gpt-oss-20b",
          fallback_count: 1,
          cached: false,
          used_paid_provider: false,
        })
      )
    );

    const result = await requestAIReading({
      domain: "zodiac",
      kind: "today",
      name: "Anna",
      birthDate: "20.05.1990",
      language: "en",
      consent: true,
    });

    expect(result.provider).toBe("groq");
    expect(result.fallback_count).toBe(1);
  });
});

describe("requestCompatibility", () => {
  it("sends both people's names and birth dates", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        text: "Compatible!",
        provider: "gemini",
        model: "gemini-flash-latest",
        fallback_count: 0,
        cached: false,
        used_paid_provider: false,
        person_a_zodiac_sign: "taurus",
        person_b_zodiac_sign: "libra",
        person_a_life_path_number: null,
        person_b_life_path_number: null,
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await requestCompatibility({
      domain: "zodiac",
      personA: { name: "Anna", birthDate: "20.05.1990" },
      personB: { name: "Ivan", birthDate: "10.10.1998" },
      language: "en",
      consent: true,
    });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.person_a).toEqual({ name: "Anna", birth_date: "20.05.1990" });
    expect(body.person_b).toEqual({ name: "Ivan", birth_date: "10.10.1998" });
  });
});
