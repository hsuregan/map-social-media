import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LogoutButton from "@/components/LogoutButton";
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

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });
  });

  it("renders a Log Out button", () => {
    render(<LogoutButton />);
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  it("calls signOut on click", async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);
    await user.click(screen.getByRole("button", { name: /log out/i }));

    await waitFor(() => {
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });

  it("redirects to login after logout", async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);
    await user.click(screen.getByRole("button", { name: /log out/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/login");
    });
  });

  it("calls router.refresh after logout", async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);
    await user.click(screen.getByRole("button", { name: /log out/i }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
