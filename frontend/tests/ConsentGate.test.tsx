import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ConsentGate from "@/components/ConsentGate";

describe("ConsentGate", () => {
  it("renders the consent label and explanation for the given language", () => {
    render(<ConsentGate language="en" checked={false} onChange={() => {}} />);
    expect(
      screen.getByText(/consent to send my name and birth date/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("calls onChange(true) the moment the box is checked — no separate submit step", async () => {
    const onChange = vi.fn();
    render(<ConsentGate language="en" checked={false} onChange={onChange} />);

    await userEvent.click(screen.getByRole("checkbox"));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("reflects an already-true checked state", () => {
    render(<ConsentGate language="en" checked={true} onChange={() => {}} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("renders in Russian and Vietnamese too", () => {
    const { rerender } = render(<ConsentGate language="ru" checked={false} onChange={() => {}} />);
    expect(screen.getByRole("checkbox")).toHaveAccessibleName(/соглашаюсь/i);

    rerender(<ConsentGate language="vi" checked={false} onChange={() => {}} />);
    expect(screen.getByRole("checkbox")).toHaveAccessibleName(/đồng ý/i);
  });
});
