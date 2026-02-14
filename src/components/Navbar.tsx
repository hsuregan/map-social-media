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
    <nav className="border-b border-linen bg-ivory">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link href="/dashboard" className="text-xl font-semibold tracking-tight text-ink">
          {username ? `${username}'s Journal` : "Journal"}
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/feed"
            className="text-sm font-medium text-stone-700 hover:text-ink"
          >
            Feed
          </Link>
          <Link
            href="/dashboard/map"
            className="text-sm font-medium text-stone-700 hover:text-ink"
          >
            Map
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-sm font-medium text-stone-700 hover:text-ink"
          >
            Settings
          </Link>
          <Link
            href="/dashboard/new"
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            New Entry
          </Link>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
