"use client";

import { useState, useEffect, useCallback } from "react";

interface DebugUser {
  id: string;
  email: string | null;
  username: string | null;
  created_at: string;
}

export default function DebugPage() {
  const [users, setUsers] = useState<DebugUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/debug/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDelete = async (userId: string) => {
    setDeleting(userId);
    setError(null);

    try {
      const res = await fetch("/api/debug/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      setConfirming(null);
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete user"
      );
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink">Debug</h1>
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink">Debug</h1>

      {error && (
        <div className="mb-4 rounded-md bg-error-bg p-3 text-sm text-error-fg">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-linen bg-ivory shadow-[var(--shadow-warm-sm)]">
        <div className="border-b border-linen px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            User Accounts ({users.length})
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Deleting an account removes the user, their profile, all journal
            entries, and associated media files.
          </p>
        </div>

        {users.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-stone-500">
            No user accounts found.
          </div>
        ) : (
          <ul className="divide-y divide-linen">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">
                    {user.username ?? user.email ?? "No name"}
                  </p>
                  <p className="text-sm text-stone-500">
                    {user.username ? user.email : null}
                  </p>
                  <p className="truncate text-xs text-stone-500">
                    {user.id}
                  </p>
                </div>

                {confirming === user.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-700">Are you sure?</span>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={deleting === user.id}
                      className="rounded-md bg-destructive px-3 py-1.5 text-sm font-semibold text-white hover:bg-destructive-hover disabled:opacity-50"
                    >
                      {deleting === user.id ? "Deleting..." : "Yes, delete"}
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      className="rounded-md border border-sand px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-linen"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirming(user.id)}
                    className="rounded-md border border-destructive-border px-3 py-1.5 text-sm font-medium text-destructive hover:bg-error-bg"
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
