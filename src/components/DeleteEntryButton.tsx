"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface DeleteEntryButtonProps {
  entryId: string;
  mediaUrl: string | null;
}

export default function DeleteEntryButton({
  entryId,
  mediaUrl,
}: DeleteEntryButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete storage file if exists
      if (mediaUrl) {
        await supabase.storage.from("journal-media").remove([mediaUrl]);
      }

      // Delete DB row
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", entryId);

      if (error) throw error;

      router.push("/dashboard");
      router.refresh();
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-md border border-destructive-border px-4 py-2 text-sm font-medium text-destructive hover:bg-error-bg"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-stone-700">Are you sure?</span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-destructive-hover disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Yes, delete"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded-md border border-sand px-4 py-2 text-sm font-medium text-stone-700 hover:bg-linen"
      >
        Cancel
      </button>
    </div>
  );
}
