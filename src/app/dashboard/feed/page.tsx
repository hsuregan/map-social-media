import { createClient } from "@/lib/supabase/server";
import { JournalEntry, Profile } from "@/lib/types";
import EntryCard from "@/components/EntryCard";

export default async function FeedPage() {
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, user_id, title, entry_type, text_content, media_url, public, created_at")
    .eq("public", true)
    .order("created_at", { ascending: false })
    .returns<JournalEntry[]>();

  const allEntries = entries ?? [];

  // Fetch usernames for all authors
  const userIds = [...new Set(allEntries.map((e) => e.user_id))];
  const usernames: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds)
      .returns<Pick<Profile, "id" | "username">[]>();
    for (const p of profiles ?? []) {
      usernames[p.id] = p.username;
    }
  }

  // Generate signed URLs for picture/video entries
  const mediaUrls: Record<string, string> = {};
  const mediaEntries = allEntries.filter(
    (e) => (e.entry_type === "picture" || e.entry_type === "video") && e.media_url
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
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Public Feed</h1>
      </div>

      {allEntries.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-sand p-12 text-center">
          <p className="text-lg font-medium text-stone-700">
            No public entries yet
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Public entries from all users will appear here.
          </p>
        </div>
      ) : (
        <div className="columns-1 gap-5 sm:columns-2">
          {allEntries.map((entry) => (
            <div key={entry.id} className="mb-5 break-inside-avoid">
              <EntryCard entry={entry} mediaUrl={mediaUrls[entry.id]} author={usernames[entry.user_id]} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
