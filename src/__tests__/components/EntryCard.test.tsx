import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import EntryCard from "@/components/EntryCard";
import { JournalEntry } from "@/lib/types";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function makeEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: "entry-1",
    user_id: "user-1",
    title: "Test Entry",
    entry_type: "text",
    text_content: "Some text content here",
    media_url: null,
    latitude: null,
    longitude: null,
    public: false,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    ...overrides,
  };
}

describe("EntryCard", () => {
  it("displays the entry title", () => {
    render(<EntryCard entry={makeEntry({ title: "My Trip" })} />);
    expect(screen.getByText("My Trip")).toBeInTheDocument();
  });

  it("displays the formatted date", () => {
    render(<EntryCard entry={makeEntry()} />);
    // Should contain the date parts
    expect(screen.getByText(/jan/i)).toBeInTheDocument();
    expect(screen.getByText(/15/)).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it("shows T icon for text entries", () => {
    render(<EntryCard entry={makeEntry({ entry_type: "text" })} />);
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("shows A icon for audio entries", () => {
    render(<EntryCard entry={makeEntry({ entry_type: "audio" })} />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("shows P icon for picture entries", () => {
    render(<EntryCard entry={makeEntry({ entry_type: "picture" })} />);
    expect(screen.getByText("P")).toBeInTheDocument();
  });

  it("shows V icon for video entries", () => {
    render(<EntryCard entry={makeEntry({ entry_type: "video" })} />);
    expect(screen.getByText("V")).toBeInTheDocument();
  });

  it("applies correct color class for text type", () => {
    render(<EntryCard entry={makeEntry({ entry_type: "text" })} />);
    const icon = screen.getByText("T");
    expect(icon.className).toContain("bg-badge-text-bg");
  });

  it("applies correct color class for audio type", () => {
    render(<EntryCard entry={makeEntry({ entry_type: "audio" })} />);
    const icon = screen.getByText("A");
    expect(icon.className).toContain("bg-badge-audio-bg");
  });

  it("shows text preview for text entries", () => {
    render(<EntryCard entry={makeEntry({ text_content: "My journal content" })} />);
    expect(screen.getByText("My journal content")).toBeInTheDocument();
  });

  it("links to the entry detail page", () => {
    render(<EntryCard entry={makeEntry({ id: "entry-42" })} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/dashboard/entry/entry-42");
  });

  it("displays the author username when provided", () => {
    render(<EntryCard entry={makeEntry()} author="alice" />);
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("does not render author when not provided", () => {
    render(<EntryCard entry={makeEntry()} />);
    expect(screen.queryByText("·")).not.toBeInTheDocument();
  });
});
