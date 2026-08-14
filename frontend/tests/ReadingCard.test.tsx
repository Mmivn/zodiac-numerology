import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ReadingCard from "@/components/ReadingCard";

describe("ReadingCard", () => {
  it("renders plain text as-is when there is no heading structure", () => {
    render(<ReadingCard title="My sign" text="Just a plain reply, no headings here." />);
    expect(screen.getByText(/Just a plain reply/)).toBeInTheDocument();
  });

  it("splits an intro paragraph from ## headings, and renders each section", () => {
    const text = [
      "Intro sentence about the reading.",
      "",
      "## Character",
      "Body text about character.",
      "",
      "## Strengths",
      "Body text about strengths.",
    ].join("\n");

    render(<ReadingCard title="My sign" text={text} />);

    expect(screen.getByText("Intro sentence about the reading.")).toBeInTheDocument();
    expect(screen.getByText("Character")).toBeInTheDocument();
    expect(screen.getByText("Body text about character.")).toBeInTheDocument();
    expect(screen.getByText("Strengths")).toBeInTheDocument();
  });

  it("also recognizes a standalone **bold** line as a heading", () => {
    const text = "**Advice:**\nTake it easy today.";
    render(<ReadingCard title="Today" text={text} />);
    expect(screen.getByText("Advice")).toBeInTheDocument();
    expect(screen.getByText("Take it easy today.")).toBeInTheDocument();
  });

  it("renders the subtitle when given", () => {
    render(<ReadingCard title="Today" text="Some text" subtitle="Taurus · 20.05" />);
    expect(screen.getByText("Taurus · 20.05")).toBeInTheDocument();
  });
});
