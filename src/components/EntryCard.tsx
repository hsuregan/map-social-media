import Link from "next/link";
import { JournalEntry } from "@/lib/types";

const typeIcons: Record<string, string> = {
  text: "T",
  audio: "A",
  picture: "P",
  video: "V",
};

const typeColors: Record<string, string> = {
  text: "bg-badge-text-bg text-badge-text-fg",
  audio: "bg-badge-audio-bg text-badge-audio-fg",
  picture: "bg-badge-picture-bg text-badge-picture-fg",
  video: "bg-badge-video-bg text-badge-video-fg",
};

export default function EntryCard({ entry, mediaUrl, author }: { entry: JournalEntry; mediaUrl?: string; author?: string }) {
  const date = new Date(entry.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const hasPreview = (entry.entry_type === "picture" || entry.entry_type === "video") && mediaUrl;

  return (
    <Link
      href={`/dashboard/entry/${entry.id}`}
      className="block overflow-hidden rounded-xl border border-linen bg-ivory shadow-[var(--shadow-warm-sm)] transition-shadow hover:shadow-[var(--shadow-warm-md)]"
    >
      {/* Media preview */}
      {entry.entry_type === "picture" && mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl}
          alt={entry.title}
          className="h-40 w-full object-cover"
        />
      )}
      {entry.entry_type === "video" && mediaUrl && (
        <div className="relative h-40 w-full">
          <video
            muted
            preload="metadata"
            className="h-full w-full object-cover"
          >
            <source src={mediaUrl} />
          </video>
          {/* Play icon overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="rgba(255,255,255,0.85)" />
              <polygon points="16,12 30,20 16,28" fill="#2C2825" />
            </svg>
          </div>
        </div>
      )}

      <div className={hasPreview ? "p-5 pt-3" : "p-5"}>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold tracking-tight text-ink">
              {entry.title}
            </h3>
            {entry.entry_type === "text" && entry.text_content && (
              <p className="mt-1 line-clamp-2 text-sm text-stone-700">
                {entry.text_content}
              </p>
            )}
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            {entry.entry_type === "audio" && mediaUrl && (
              <audio
                controls
                preload="metadata"
                src={mediaUrl}
                className="mt-2 w-full"
              />
            )}
            <p className="mt-2 text-xs text-stone-500">
              {author && <span className="font-medium text-stone-700">{author}</span>}
              {author && <span className="mx-1.5">&middot;</span>}
              <span className="uppercase tracking-wider">{date}</span>
            </p>
          </div>
          <span
            className={`ml-3 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              typeColors[entry.entry_type]
            }`}
          >
            {typeIcons[entry.entry_type]}
          </span>
        </div>
      </div>
    </Link>
  );
}
