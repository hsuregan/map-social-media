import { createClient } from "@/lib/supabase/server";
import { JournalEntry } from "@/lib/types";
import EntryCard from "@/components/EntryCard";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<JournalEntry[]>();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Journal</h1>
      </div>

      {!entries || entries.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-lg font-medium text-gray-500">
            No entries yet
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Create your first journal entry to get started.
          </p>
          <Link
            href="/dashboard/new"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            New Entry
          </Link>
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
