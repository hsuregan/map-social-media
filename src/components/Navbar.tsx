"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsername() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUsername(profile.username);
      }
    }
    loadUsername();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-xl font-bold text-gray-900">
          {username ? `${username}'s Journal` : "Journal"}
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/feed"
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Feed
          </Link>
          <Link
            href="/dashboard/map"
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Map
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Settings
          </Link>
          <Link
            href="/dashboard/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            New Entry
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}
