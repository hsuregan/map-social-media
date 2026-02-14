"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";

export default function SettingsPage() {
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single<Profile>();

      if (profile) {
        setUsername(profile.username);
        setCurrentUsername(profile.username);
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmed = username.trim();
    if (!trimmed) {
      setError("Username cannot be empty.");
      return;
    }

    if (trimmed === currentUsername) {
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username: trimmed })
        .eq("id", user.id);

      if (updateError) {
        if (updateError.code === "23505") {
          setError("This username is already taken. Please choose a different one.");
        } else {
          throw updateError;
        }
        return;
      }

      setCurrentUsername(trimmed);
      setSuccess("Username updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update username.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink">Settings</h1>

      <div className="rounded-xl border border-linen bg-ivory p-6 shadow-[var(--shadow-warm-sm)]">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-error-bg p-3 text-sm text-error-fg">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-success-bg p-3 text-sm text-success-fg">
              {success}
            </div>
          )}

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-stone-700"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter a username"
              className="mt-1 block w-full rounded-md border border-sand bg-ivory px-3 py-2 text-ink shadow-[var(--shadow-warm-sm)] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <button
            type="submit"
            disabled={saving || username.trim() === currentUsername}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-warm-sm)] hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
