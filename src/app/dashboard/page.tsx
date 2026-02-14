import { createClient } from "@/lib/supabase/server";
import { JournalEntry, Profile } from "@/lib/types";
import EntryCard from "@/components/EntryCard";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, user_id, title, entry_type, text_content, media_url, public, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<JournalEntry[]>();

  const allEntries = entries ?? [];

  // Fetch current user's username
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user!.id)
    .single<Pick<Profile, "username">>();
  const currentUsername = profile?.username;

  // Generate signed URLs for picture/video entries
  const mediaUrls: Record<string, string> = {};
  const mediaEntries = allEntries.filter(
    (e) => e.entry_type !== "text" && e.media_url
  );

  if (mediaEntries.length > 0) {
    const results = await Promise.all(
      mediaEntries.map((e) =>
        supabase.storage
          .from("journal-media")
          .createSignedUrl(e.media_url!, 3600)
          .then(({ data }) => ({ id: e.id, url: data?.signedUrl ?? null }))
      )
    );
    for (const r of results) {
      if (r.url) mediaUrls[r.id] = r.url;
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">My Journal</h1>
      </div>

      {allEntries.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-sand p-12 text-center">
          <p className="text-lg font-medium text-stone-700">
            No entries yet
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Create your first journal entry to get started.
          </p>
          <Link
            href="/dashboard/new"
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            New Entry
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {allEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} mediaUrl={mediaUrls[entry.id]} author={currentUsername} />
          ))}
        </div>
      )}
    </div>
  );
}
