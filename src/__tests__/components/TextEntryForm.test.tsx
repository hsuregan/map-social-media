import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TextEntryForm from "@/components/TextEntryForm";

describe("TextEntryForm", () => {
  it("renders a textarea with the given value", () => {
    render(<TextEntryForm value="Hello world" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("Hello world");
  });

  it("has the label Journal Entry", () => {
    render(<TextEntryForm value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText(/journal entry/i)).toBeInTheDocument();
  });

  it("shows placeholder text", () => {
    render(<TextEntryForm value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText(/write your thoughts/i)).toBeInTheDocument();
  });

  it("calls onChange when typing", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TextEntryForm value="" onChange={handleChange} />);

    await user.type(screen.getByRole("textbox"), "a");
    expect(handleChange).toHaveBeenCalledWith("a");
  });
});
