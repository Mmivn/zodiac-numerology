import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ReadingCard from "@/components/ReadingCard";

describe("ReadingCard", () => {
  it("renders plain text as-is when there is no markdown structure", () => {
    render(<ReadingCard title="My sign" text="Just a plain reply, no headings here." />);
    expect(screen.getByText(/Just a plain reply/)).toBeInTheDocument();
  });

  it("renders ## headings as real heading elements, not literal text", () => {
    const text = [
      "Intro sentence about the reading.",
      "",
      "## Character",
      "Body text about character.",
      "",
      "## Strengths",
      "Body text about strengths.",
    ].join("\n");

    const { container } = render(<ReadingCard title="My sign" text={text} />);

    expect(screen.getByText("Intro sentence about the reading.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Character" })).toBeInTheDocument();
    expect(screen.getByText("Body text about character.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Strengths" })).toBeInTheDocument();
    // The literal "##" marker must never reach the rendered text.
    expect(container.textContent).not.toContain("##");
  });

  it("renders **bold** as a real <strong> element, never literal asterisks", () => {
    const text = "This is **very important** advice for today.";
    const { container } = render(<ReadingCard title="Today" text={text} />);

    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe("very important");
    expect(container.textContent).not.toContain("**");
  });

  it("renders --- as a real <hr>, never literal dashes", () => {
    const text = "Section one.\n\n---\n\nSection two.";
    const { container } = render(<ReadingCard title="Today" text={text} />);

    expect(container.querySelector("hr")).not.toBeNull();
    expect(container.textContent).not.toContain("---");
  });

  it("renders bullet lists as real <ul>/<li> elements", () => {
    const text = "Key themes:\n\n- Growth\n- Patience\n- Clarity";
    const { container } = render(<ReadingCard title="Today" text={text} />);

    const items = container.querySelectorAll("li");
    expect(items.length).toBe(3);
    expect(items[0].textContent).toBe("Growth");
  });

  it("renders the subtitle when given", () => {
    render(<ReadingCard title="Today" text="Some text" subtitle="Taurus · 20.05" />);
    expect(screen.getByText("Taurus · 20.05")).toBeInTheDocument();
  });

  it("renders the panel title", () => {
    render(<ReadingCard title="My Sign Reading" text="Some text" />);
    expect(screen.getByText("My Sign Reading")).toBeInTheDocument();
  });
});
