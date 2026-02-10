import { createClient } from "@/lib/supabase/server";
import { JournalEntry } from "@/lib/types";
import EntryCard from "@/components/EntryCard";

export default async function FeedPage() {
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, user_id, title, entry_type, text_content, public, created_at")
    .eq("public", true)
    .order("created_at", { ascending: false })
    .returns<JournalEntry[]>();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Public Feed</h1>
      </div>

      {!entries || entries.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-lg font-medium text-gray-500">
            No public entries yet
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Public entries from all users will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
