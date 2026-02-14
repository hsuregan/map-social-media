"use client";

import dynamic from "next/dynamic";
import { JournalEntry } from "@/lib/types";

const EntryMap = dynamic(() => import("@/components/EntryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-1 items-center justify-center bg-linen text-stone-500">
      Loading map...
    </div>
  ),
});

interface EntryMapWrapperProps {
  entries: JournalEntry[];
  currentUserId: string;
  mediaUrls: Record<string, string>;
  popupEntryId: string | null;
}

export default function EntryMapWrapper({
  entries,
  currentUserId,
  mediaUrls,
  popupEntryId,
}: EntryMapWrapperProps) {
  return (
    <EntryMap
      entries={entries}
      currentUserId={currentUserId}
      mediaUrls={mediaUrls}
      popupEntryId={popupEntryId}
    />
  );
}
