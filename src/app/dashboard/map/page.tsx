import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { JournalEntry } from "@/lib/types";
import EntryMapWrapper from "@/components/EntryMapWrapper";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ popup?: string }>;
}) {
  const { popup } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, user_id, title, entry_type, text_content, media_url, latitude, longitude, public, created_at")
    .or(`user_id.eq.${user!.id},public.eq.true`)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("created_at", { ascending: false })
    .returns<JournalEntry[]>();

  const geoEntries = entries ?? [];

  // Generate signed URLs using service role client (bypasses storage policies
  // so we can serve media from any user's public entries)
  const serviceClient = createServiceClient();
  const mediaUrls: Record<string, string> = {};
  const mediaEntries = geoEntries.filter(
    (e) => e.entry_type !== "text" && e.media_url
  );

  if (mediaEntries.length > 0) {
    const results = await Promise.all(
      mediaEntries.map((e) =>
        serviceClient.storage
          .from("journal-media")
          .createSignedUrl(e.media_url!, 3600)
          .then(({ data }) => ({ id: e.id, url: data?.signedUrl ?? null }))
      )
    );
    for (const r of results) {
      if (r.url) mediaUrls[r.id] = r.url;
    }
  }

  const popupEntryId = popup ?? null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink">Entry Map</h1>

      {geoEntries.length === 0 ? (
        <div className="rounded-xl border border-linen bg-ivory p-8 text-center">
          <p className="text-stone-500">
            No geotagged entries yet. Create a new entry and allow location
            access to see it on the map.
          </p>
        </div>
      ) : (
        <EntryMapWrapper
          entries={geoEntries}
          currentUserId={user!.id}
          mediaUrls={mediaUrls}
          popupEntryId={popupEntryId}
        />
      )}
    </div>
  );
}
