import { createClient } from "@/lib/supabase/server";
import { JournalEntry } from "@/lib/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteEntryButton from "@/components/DeleteEntryButton";

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", id)
    .single<JournalEntry>();

  if (!entry) {
    notFound();
  }

  // Generate signed URL for private media
  let signedUrl: string | null = null;
  if (entry.media_url) {
    const { data } = await supabase.storage
      .from("journal-media")
      .createSignedUrl(entry.media_url, 3600);
    signedUrl = data?.signedUrl ?? null;
  }

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
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          &larr; Back to Journal
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{entry.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{date}</p>
            <span className="mt-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 capitalize">
              {entry.entry_type}
            </span>
          </div>
          <DeleteEntryButton entryId={entry.id} mediaUrl={entry.media_url} />
        </div>

        <div className="mt-6">
          {entry.entry_type === "text" && entry.text_content && (
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-gray-800">
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
                className="max-w-full rounded-lg"
              />
            </div>
          )}

          {entry.entry_type === "video" && signedUrl && (
            <div>
              <video
                controls
                src={signedUrl}
                className="max-w-full rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
