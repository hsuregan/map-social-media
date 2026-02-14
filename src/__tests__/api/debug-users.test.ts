import { describe, it, expect, vi, beforeEach } from "vitest";

const mockListUsers = vi.fn();
const mockFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        listUsers: mockListUsers,
      },
    },
    from: mockFrom,
  })),
}));

import { GET } from "@/app/api/debug/users/route";

describe("GET /api/debug/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  it("returns 500 when service role key is missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("returns user list with profile usernames", async () => {
    mockListUsers.mockResolvedValue({
      data: {
        users: [
          { id: "user-1", email: "a@test.com", created_at: "2024-01-01" },
          { id: "user-2", email: "b@test.com", created_at: "2024-01-02" },
        ],
      },
      error: null,
    });

    const selectBuilder = {
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({
          data: [
            { id: "user-1", username: "alice" },
            { id: "user-2", username: "bob" },
          ],
        }).then(resolve),
    };
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(selectBuilder) });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0]).toEqual({
      id: "user-1",
      email: "a@test.com",
      username: "alice",
      created_at: "2024-01-01",
    });
    expect(body[1].username).toBe("bob");
  });

  it("returns 500 on listUsers error", async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [] },
      error: { message: "Admin error" },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Admin error");
  });

  it("handles null profiles gracefully", async () => {
    mockListUsers.mockResolvedValue({
      data: {
        users: [{ id: "user-1", email: "a@test.com", created_at: "2024-01-01" }],
      },
      error: null,
    });

    const selectBuilder = {
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: null }).then(resolve),
    };
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(selectBuilder) });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body[0].username).toBeNull();
  });
});
