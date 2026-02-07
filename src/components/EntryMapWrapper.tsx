"use client";

import dynamic from "next/dynamic";
import { JournalEntry } from "@/lib/types";

const EntryMap = dynamic(() => import("@/components/EntryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] w-full items-center justify-center rounded-lg bg-gray-100 text-gray-500">
      Loading map...
    </div>
  ),
});

interface EntryMapWrapperProps {
  entries: JournalEntry[];
  currentUserId: string;
}

export default function EntryMapWrapper({ entries, currentUserId }: EntryMapWrapperProps) {
  return <EntryMap entries={entries} currentUserId={currentUserId} />;
}
