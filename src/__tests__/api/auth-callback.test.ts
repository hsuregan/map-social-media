import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to create mocks that are available in the factory
const { mockExchangeCodeForSession } = vi.hoisted(() => ({
  mockExchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  }),
}));

import { GET } from "@/app/auth/callback/route";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exchanges code and redirects to /dashboard by default", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ data: {}, error: null });

    const request = new Request("http://localhost:3000/auth/callback?code=test-code");
    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("test-code");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("redirects to custom next path when provided", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ data: {}, error: null });

    const request = new Request(
      "http://localhost:3000/auth/callback?code=test-code&next=/dashboard/settings"
    );
    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard/settings"
    );
  });

  it("redirects to /auth/login when no code provided", async () => {
    const request = new Request("http://localhost:3000/auth/callback");
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/auth/login");
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("redirects to /auth/login when code exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: {},
      error: new Error("Invalid code"),
    });

    const request = new Request("http://localhost:3000/auth/callback?code=bad-code");
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/auth/login");
  });
});
