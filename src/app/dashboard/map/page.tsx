import { createClient } from "@/lib/supabase/server";
import { JournalEntry } from "@/lib/types";
import EntryMapWrapper from "@/components/EntryMapWrapper";

export default async function MapPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, user_id, title, entry_type, text_content, latitude, longitude, public, created_at")
    .or(`user_id.eq.${user!.id},public.eq.true`)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("created_at", { ascending: false })
    .returns<JournalEntry[]>();

  const geoEntries = entries ?? [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Entry Map</h1>

      {geoEntries.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">
            No geotagged entries yet. Create a new entry and allow location
            access to see it on the map.
          </p>
        </div>
      ) : (
        <EntryMapWrapper entries={geoEntries} currentUserId={user!.id} />
      )}
    </div>
  );
}
