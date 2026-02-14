import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockDeleteUser = vi.fn();
const mockFrom = vi.fn();
const mockStorageFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        deleteUser: mockDeleteUser,
      },
    },
    from: mockFrom,
    storage: {
      from: mockStorageFrom,
    },
  })),
}));

import { POST } from "@/app/api/debug/delete-user/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/debug/delete-user", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/debug/delete-user", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

    // Default mock: entries with media
    const selectEq = {
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({
          data: [{ media_url: "user-1/audio.webm" }, { media_url: null }],
        }).then(resolve),
    };
    const selectBuilder = { eq: vi.fn().mockReturnValue(selectEq) };
    const deleteEq = {
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(resolve),
    };
    const deleteBuilder = { eq: vi.fn().mockReturnValue(deleteEq) };

    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue(selectBuilder),
      delete: vi.fn().mockReturnValue(deleteBuilder),
    }));

    mockStorageFrom.mockReturnValue({
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    mockDeleteUser.mockResolvedValue({ data: {}, error: null });
  });

  it("returns 400 when userId is missing", async () => {
    const request = makeRequest({});
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("userId is required");
  });

  it("returns 400 when userId is not a string", async () => {
    const request = makeRequest({ userId: 123 });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("userId is required");
  });

  it("returns 500 when service role key is missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const request = makeRequest({ userId: "user-1" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("deletes media files from storage", async () => {
    const removeMock = vi.fn().mockResolvedValue({ data: null, error: null });
    mockStorageFrom.mockReturnValue({ remove: removeMock });

    const request = makeRequest({ userId: "user-1" });
    await POST(request);

    expect(mockStorageFrom).toHaveBeenCalledWith("journal-media");
    expect(removeMock).toHaveBeenCalledWith(["user-1/audio.webm"]);
  });

  it("deletes journal entries for the user", async () => {
    const deleteEqMock = vi.fn().mockReturnValue({
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(resolve),
    });
    const deleteMock = vi.fn().mockReturnValue({ eq: deleteEqMock });

    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          then: (resolve: (v: unknown) => unknown) =>
            Promise.resolve({ data: [] }).then(resolve),
        }),
      }),
      delete: deleteMock,
    }));

    const request = makeRequest({ userId: "user-1" });
    await POST(request);

    // from("journal_entries") and from("profiles") are both called
    expect(mockFrom).toHaveBeenCalledWith("journal_entries");
    expect(mockFrom).toHaveBeenCalledWith("profiles");
  });

  it("deletes profile for the user", async () => {
    const request = makeRequest({ userId: "user-1" });
    await POST(request);

    expect(mockFrom).toHaveBeenCalledWith("profiles");
  });

  it("deletes auth user", async () => {
    const request = makeRequest({ userId: "user-1" });
    await POST(request);

    expect(mockDeleteUser).toHaveBeenCalledWith("user-1");
  });

  it("returns success on complete deletion", async () => {
    const request = makeRequest({ userId: "user-1" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 500 when auth user deletion fails", async () => {
    mockDeleteUser.mockResolvedValue({
      data: {},
      error: { message: "Cannot delete user" },
    });

    const request = makeRequest({ userId: "user-1" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Cannot delete user");
  });

  it("handles entries with no media URLs", async () => {
    const selectEq = {
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [{ media_url: null }] }).then(resolve),
    };
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(selectEq) }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          then: (resolve: (v: unknown) => unknown) =>
            Promise.resolve({ data: null, error: null }).then(resolve),
        }),
      }),
    }));

    const removeMock = vi.fn();
    mockStorageFrom.mockReturnValue({ remove: removeMock });

    const request = makeRequest({ userId: "user-1" });
    await POST(request);

    // Storage remove should NOT be called when there are no media URLs
    expect(removeMock).not.toHaveBeenCalled();
  });
});
