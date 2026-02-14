import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteEntryButton from "@/components/DeleteEntryButton";
import { createMockSupabaseClient } from "../mocks/supabase";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh, back: vi.fn() }),
}));

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

describe("DeleteEntryButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chainable delete builder
    const deleteBuilder = {
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    mockSupabase.from.mockReturnValue({
      delete: vi.fn().mockReturnValue(deleteBuilder),
    } as never);
    mockSupabase.storage.from.mockReturnValue({
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as never);
  });

  it("shows Delete button initially", () => {
    render(<DeleteEntryButton entryId="entry-1" mediaUrl={null} />);
    expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
  });

  it("shows confirmation UI after clicking Delete", async () => {
    const user = userEvent.setup();
    render(<DeleteEntryButton entryId="entry-1" mediaUrl={null} />);

    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /yes, delete/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("returns to initial state on cancel", async () => {
    const user = userEvent.setup();
    render(<DeleteEntryButton entryId="entry-1" mediaUrl={null} />);

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
    expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
  });

  it("deletes entry without media and redirects", async () => {
    const user = userEvent.setup();
    render(<DeleteEntryButton entryId="entry-1" mediaUrl={null} />);

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await user.click(screen.getByRole("button", { name: /yes, delete/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
    expect(mockRefresh).toHaveBeenCalled();
    // Storage remove should not have been called
    expect(mockSupabase.storage.from).not.toHaveBeenCalled();
  });

  it("deletes storage file when mediaUrl is present", async () => {
    const storageMock = {
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    mockSupabase.storage.from.mockReturnValue(storageMock as never);

    const user = userEvent.setup();
    render(<DeleteEntryButton entryId="entry-1" mediaUrl="user-123/file.webm" />);

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await user.click(screen.getByRole("button", { name: /yes, delete/i }));

    await waitFor(() => {
      expect(mockSupabase.storage.from).toHaveBeenCalledWith("journal-media");
      expect(storageMock.remove).toHaveBeenCalledWith(["user-123/file.webm"]);
    });
  });

  it("calls DB delete with correct entry ID", async () => {
    const eqMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockSupabase.from.mockReturnValue({ delete: deleteMock } as never);

    const user = userEvent.setup();
    render(<DeleteEntryButton entryId="entry-42" mediaUrl={null} />);

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await user.click(screen.getByRole("button", { name: /yes, delete/i }));

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith("journal_entries");
      expect(eqMock).toHaveBeenCalledWith("id", "entry-42");
    });
  });

  it("shows deleting state while in progress", async () => {
    let resolveDelete: (v: unknown) => void;
    const eqMock = vi.fn().mockReturnValue(
      new Promise((r) => { resolveDelete = r; })
    );
    mockSupabase.from.mockReturnValue({
      delete: vi.fn().mockReturnValue({ eq: eqMock }),
    } as never);

    const user = userEvent.setup();
    render(<DeleteEntryButton entryId="entry-1" mediaUrl={null} />);

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await user.click(screen.getByRole("button", { name: /yes, delete/i }));

    expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled();

    resolveDelete!({ data: null, error: null });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("recovers on delete error", async () => {
    const eqMock = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("Delete failed"),
    });
    mockSupabase.from.mockReturnValue({
      delete: vi.fn().mockReturnValue({ eq: eqMock }),
    } as never);

    const user = userEvent.setup();
    render(<DeleteEntryButton entryId="entry-1" mediaUrl={null} />);

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await user.click(screen.getByRole("button", { name: /yes, delete/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
