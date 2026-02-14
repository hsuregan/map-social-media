import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "@/components/AuthForm";
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

// Mock next/link as a simple anchor
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("AuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
    mockSupabase.auth.signUp.mockResolvedValue({ data: {}, error: null });
  });

  // Rendering
  it("renders login form with correct heading", () => {
    render(<AuthForm mode="login" />);
    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders signup form with correct heading", () => {
    render(<AuthForm mode="signup" />);
    expect(screen.getByRole("heading", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows email and password inputs", () => {
    render(<AuthForm mode="login" />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("shows Sign In button for login mode", () => {
    render(<AuthForm mode="login" />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows Sign Up button for signup mode", () => {
    render(<AuthForm mode="signup" />);
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("shows link to signup from login page", () => {
    render(<AuthForm mode="login" />);
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/auth/signup");
  });

  it("shows link to login from signup page", () => {
    render(<AuthForm mode="signup" />);
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/auth/login");
  });

  // Login flow
  it("calls signInWithPassword and redirects on login", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
    expect(mockRefresh).toHaveBeenCalled();
  });

  // Signup flow
  it("calls signUp and shows confirmation message", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/password/i), "newpass123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "newpass123",
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining("/auth/callback"),
        }),
      });
    });
    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
  });

  // Error handling
  it("displays error on login failure", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: new Error("Invalid credentials"),
    });

    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText(/email/i), "bad@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("displays error on signup failure", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: {},
      error: new Error("Email already registered"),
    });

    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText(/email/i), "dup@example.com");
    await user.type(screen.getByLabelText(/password/i), "pass123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
    });
  });

  it("shows loading state while submitting", async () => {
    let resolveSignIn: (v: unknown) => void;
    mockSupabase.auth.signInWithPassword.mockReturnValue(
      new Promise((r) => { resolveSignIn = r; })
    );

    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button", { name: /loading/i })).toBeDisabled();

    resolveSignIn!({ data: {}, error: null });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign in/i })).not.toBeDisabled();
    });
  });

  it("does not redirect on signup (shows message instead)", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/password/i), "pass123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
