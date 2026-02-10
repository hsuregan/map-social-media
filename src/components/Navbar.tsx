import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
  }

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
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
