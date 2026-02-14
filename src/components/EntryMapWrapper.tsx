"use client";

import dynamic from "next/dynamic";
import { JournalEntry } from "@/lib/types";

const EntryMap = dynamic(() => import("@/components/EntryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] w-full items-center justify-center rounded-xl bg-linen text-stone-500">
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
