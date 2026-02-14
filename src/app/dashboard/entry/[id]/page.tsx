import { createClient } from "@/lib/supabase/server";
import { JournalEntry, Profile } from "@/lib/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteEntryButton from "@/components/DeleteEntryButton";

export default async function EntryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const supabase = await createClient();

  // Fetch entry and user in parallel
  const [{ data: entry }, { data: { user } }] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("*")
      .eq("id", id)
      .single<JournalEntry>(),
    supabase.auth.getUser(),
  ]);

  if (!entry) {
    notFound();
  }

  const isOwner = user?.id === entry.user_id;

  // Fetch profile and signed URL in parallel
  const [{ data: profile }, signedUrl] = await Promise.all([
    supabase
      .from("profiles")
      .select("username")
      .eq("id", entry.user_id)
      .single<Pick<Profile, "username">>(),
    entry.media_url
      ? supabase.storage
          .from("journal-media")
          .createSignedUrl(entry.media_url, 3600)
          .then(({ data }) => data?.signedUrl ?? null)
      : Promise.resolve(null),
  ]);

  const date = new Date(entry.created_at).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        {from === "map" ? (
          <Link
            href={`/dashboard/map?popup=${id}`}
            className="text-sm text-accent hover:text-accent-hover"
          >
            &larr; Back to Map
          </Link>
        ) : (
          <Link
            href={isOwner ? "/dashboard" : "/dashboard/feed"}
            className="text-sm text-accent hover:text-accent-hover"
          >
            &larr; {isOwner ? "Back to Journal" : "Back to Feed"}
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-linen bg-ivory p-6 shadow-[var(--shadow-warm-sm)]">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{entry.title}</h1>
            <p className="mt-1 text-sm text-stone-500">
              by {profile?.username ?? "Unknown"} &middot; {date}
            </p>
            <div className="mt-2 flex gap-2">
              <span className="inline-block rounded-full bg-linen px-3 py-1 text-xs font-medium text-stone-700 capitalize">
                {entry.entry_type}
              </span>
              {entry.public && (
                <span className="inline-block rounded-full bg-success-bg px-3 py-1 text-xs font-medium text-success-fg">
                  Public
                </span>
              )}
            </div>
          </div>
          {isOwner && (
            <DeleteEntryButton entryId={entry.id} mediaUrl={entry.media_url} />
          )}
        </div>

        {entry.latitude !== null && entry.longitude !== null && (
          <div className="mt-4 flex items-center gap-1.5 text-sm text-stone-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.274 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                clipRule="evenodd"
              />
            </svg>
            <a
              href={`https://www.openstreetmap.org/?mlat=${entry.latitude}&mlon=${entry.longitude}#map=15/${entry.latitude}/${entry.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover"
            >
              {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
            </a>
          </div>
        )}

        <div className="mt-6">
          {entry.entry_type === "text" && entry.text_content && (
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-ink">
                {entry.text_content}
              </p>
            </div>
          )}

          {entry.entry_type === "audio" && signedUrl && (
            <div>
              <audio controls src={signedUrl} className="w-full" />
            </div>
          )}

          {entry.entry_type === "picture" && signedUrl && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt={entry.title}
                className="max-w-full rounded-xl"
              />
            </div>
          )}

          {entry.entry_type === "video" && signedUrl && (
            <div>
              <video
                controls
                src={signedUrl}
                className="max-w-full rounded-xl"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
