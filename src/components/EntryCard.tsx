import Link from "next/link";
import { JournalEntry } from "@/lib/types";

const typeIcons: Record<string, string> = {
  text: "T",
  audio: "A",
  picture: "P",
  video: "V",
};

const typeColors: Record<string, string> = {
  text: "bg-blue-100 text-blue-700",
  audio: "bg-purple-100 text-purple-700",
  picture: "bg-green-100 text-green-700",
  video: "bg-orange-100 text-orange-700",
};

export default function EntryCard({ entry }: { entry: JournalEntry }) {
  const date = new Date(entry.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/dashboard/entry/${entry.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-gray-900">
            {entry.title}
          </h3>
          {entry.entry_type === "text" && entry.text_content && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
              {entry.text_content}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">{date}</p>
        </div>
        <span
          className={`ml-3 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            typeColors[entry.entry_type]
          }`}
        >
          {typeIcons[entry.entry_type]}
        </span>
      </div>
    </Link>
  );
}
