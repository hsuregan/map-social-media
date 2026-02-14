import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "@/app/dashboard/settings/page";
import { createMockSupabaseClient } from "../mocks/supabase";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: return a profile
    const profileBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "user-123", username: "testuser", created_at: "", updated_at: "" },
        error: null,
      }),
    };

    const updateBuilder = {
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: profileBuilder.select,
          eq: profileBuilder.eq,
          single: profileBuilder.single,
          update: vi.fn().mockReturnValue(updateBuilder),
        } as never;
      }
      return {} as never;
    });

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
  });

  it("shows loading state initially", () => {
    render(<SettingsPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows settings heading", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /settings/i })).toBeInTheDocument();
    });
  });

  it("loads and displays current username", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
    });
  });

  it("has a username input field", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });
  });

  it("has a Save button", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });
  });

  it("allows changing the username", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/username/i);
    await user.clear(input);
    await user.type(input, "newname");

    expect(input).toHaveValue("newname");
  });

  it("shows success message after saving", async () => {
    const updateEq = vi.fn().mockResolvedValue({ data: null, error: null });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: "user-123", username: "testuser", created_at: "", updated_at: "" },
            error: null,
          }),
          update: vi.fn().mockReturnValue({ eq: updateEq }),
        } as never;
      }
      return {} as never;
    });

    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/username/i);
    await user.clear(input);
    await user.type(input, "newname");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/username updated successfully/i)).toBeInTheDocument();
    });
  });

  it("shows error for duplicate username (23505)", async () => {
    const updateEq = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate" },
    });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: "user-123", username: "testuser", created_at: "", updated_at: "" },
            error: null,
          }),
          update: vi.fn().mockReturnValue({ eq: updateEq }),
        } as never;
      }
      return {} as never;
    });

    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/username/i);
    await user.clear(input);
    await user.type(input, "taken");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/already taken/i)).toBeInTheDocument();
    });
  });

  it("shows empty username error", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/username/i);
    await user.clear(input);
    // Need to trigger submit with empty input -- clear sets it to empty
    // But the button is disabled when username matches current. We need to submit the form directly.
    // Submit directly by pressing enter
    await user.type(input, " ");
    await user.clear(input);
    // Force form submission
    const form = input.closest("form")!;
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    await waitFor(() => {
      expect(screen.getByText(/username cannot be empty/i)).toBeInTheDocument();
    });
  });

  it("disables save button when username unchanged", async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  it("shows profile section heading", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /profile/i })).toBeInTheDocument();
    });
  });

  // --- Change Password tests ---

  it("shows change password section", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /change password/i })).toBeInTheDocument();
    });
  });

  it("has new password and confirm password fields", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm New Password")).toBeInTheDocument();
    });
  });

  it("has an Update Password button", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
    });
  });

  it("disables Update Password button when fields are empty", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /update password/i })).toBeDisabled();
    });
  });

  it("shows error when password is too short", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("New Password"), "abc");
    await user.type(screen.getByLabelText("Confirm New Password"), "abc");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("New Password"), "newpass123");
    await user.type(screen.getByLabelText("Confirm New Password"), "different");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("shows success message after password update", async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({ data: { user: {} }, error: null });

    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("New Password"), "newpass123");
    await user.type(screen.getByLabelText("Confirm New Password"), "newpass123");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
    });
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: "newpass123" });
  });

  it("clears password fields after successful update", async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({ data: { user: {} }, error: null });

    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("New Password"), "newpass123");
    await user.type(screen.getByLabelText("Confirm New Password"), "newpass123");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByLabelText("New Password")).toHaveValue("");
      expect(screen.getByLabelText("Confirm New Password")).toHaveValue("");
    });
  });

  it("shows error message when password update fails", async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Password update failed"),
    });

    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("New Password"), "newpass123");
    await user.type(screen.getByLabelText("Confirm New Password"), "newpass123");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password update failed/i)).toBeInTheDocument();
    });
  });
});
