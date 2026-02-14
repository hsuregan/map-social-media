import { vi } from "vitest";

function createChainableBuilder(terminalValue: { data: unknown; error: unknown } = { data: null, error: null }) {
  const builder: Record<string, unknown> = {};
  const methods = ["select", "insert", "update", "delete", "eq", "or", "not", "order", "single", "returns", "neq", "lt", "gt", "gte", "lte", "like", "ilike", "is", "in", "contains", "containedBy", "range", "textSearch", "match", "limit", "maybeSingle"];

  for (const method of methods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  // Terminal methods return the value
  builder.single = vi.fn().mockResolvedValue(terminalValue);
  builder.maybeSingle = vi.fn().mockResolvedValue(terminalValue);

  // Make the builder itself thenable so `await supabase.from(...).select(...)` works
  builder.then = (resolve: (v: unknown) => unknown) => Promise.resolve(terminalValue).then(resolve);

  return builder;
}

export function createMockSupabaseClient() {
  const queryBuilder = createChainableBuilder();

  const storage = {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://test.supabase.co/storage/test" } }),
    }),
  };

  const auth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    exchangeCodeForSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
    admin: {
      listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
      deleteUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  };

  const client = {
    from: vi.fn().mockReturnValue(queryBuilder),
    storage,
    auth,
    _queryBuilder: queryBuilder,
  };

  return client;
}

export function createMockQueryBuilder(resolvedValue: { data: unknown; error: unknown } = { data: null, error: null }) {
  return createChainableBuilder(resolvedValue);
}
