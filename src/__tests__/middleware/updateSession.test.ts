import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateSession } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

// Mock createServerClient
const mockGetUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

function createMockRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Unauthenticated user tests
  it("redirects unauthenticated user from /dashboard to /auth/login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = createMockRequest("/dashboard");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login");
  });

  it("redirects unauthenticated user from /dashboard/settings to /auth/login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = createMockRequest("/dashboard/settings");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login");
  });

  it("allows unauthenticated user to access /auth/login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = createMockRequest("/auth/login");
    const response = await updateSession(request);

    // Should not redirect
    expect(response.status).toBe(200);
  });

  it("allows unauthenticated user to access homepage", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = createMockRequest("/");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });

  // Authenticated user tests
  it("redirects authenticated user from /auth/login to /dashboard", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const request = createMockRequest("/auth/login");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard");
  });

  it("redirects authenticated user from /auth/signup to /dashboard", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const request = createMockRequest("/auth/signup");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard");
  });

  it("allows authenticated user to access /dashboard", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const request = createMockRequest("/dashboard");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });

  // Passthrough tests
  it("passes through non-auth non-dashboard routes", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = createMockRequest("/about");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });

  it("passes through API routes for unauthenticated users", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = createMockRequest("/api/debug/users");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });
});
