"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EntryType } from "@/lib/types";
import TextEntryForm from "@/components/TextEntryForm";
import AudioRecorder from "@/components/AudioRecorder";
import MediaUploader from "@/components/MediaUploader";

const entryTypes: { value: EntryType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "audio", label: "Audio" },
  { value: "picture", label: "Picture" },
  { value: "video", label: "Video" },
];

export default function NewEntryPage() {
  const [title, setTitle] = useState("");
  const [entryType, setEntryType] = useState<EntryType>("text");
  const [textContent, setTextContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const audioBlobRef = useRef<{ blob: Blob; mimeType: string } | null>(null);
  const mediaFileRef = useRef<File | null>(null);

  const getFileExtension = (mimeType: string): string => {
    const map: Record<string, string> = {
      "audio/webm;codecs=opus": "webm",
      "audio/webm": "webm",
      "audio/ogg;codecs=opus": "ogg",
      "audio/mp4": "m4a",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "video/mp4": "mp4",
      "video/webm": "webm",
      "video/quicktime": "mov",
    };
    return map[mimeType] || mimeType.split("/")[1] || "bin";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (entryType === "text" && !textContent.trim()) {
      setError("Text content is required for text entries.");
      return;
    }

    if (entryType === "audio" && !audioBlobRef.current) {
      setError("Please record audio before saving.");
      return;
    }

    if (
      (entryType === "picture" || entryType === "video") &&
      !mediaFileRef.current
    ) {
      setError("Please select a file before saving.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let mediaUrl: string | null = null;

      // Upload media if needed
      if (entryType === "audio" && audioBlobRef.current) {
        const { blob, mimeType } = audioBlobRef.current;
        const ext = getFileExtension(mimeType);
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("journal-media")
          .upload(path, blob, { contentType: mimeType });
        if (uploadError) throw uploadError;
        mediaUrl = path;
      }

      if (
        (entryType === "picture" || entryType === "video") &&
        mediaFileRef.current
      ) {
        const file = mediaFileRef.current;
        const ext = getFileExtension(file.type);
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("journal-media")
          .upload(path, file, { contentType: file.type });
        if (uploadError) throw uploadError;
        mediaUrl = path;
      }

      // Insert DB row
      const { error: insertError } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          title: title.trim(),
          entry_type: entryType,
          text_content: entryType === "text" ? textContent : null,
          media_url: mediaUrl,
        });

      if (insertError) {
        // Cleanup uploaded file on DB insert failure
        if (mediaUrl) {
          await supabase.storage.from("journal-media").remove([mediaUrl]);
        }
        throw insertError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        New Journal Entry
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry title"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entry Type
          </label>
          <div className="flex gap-2">
            {entryTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setEntryType(t.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  entryType === t.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {entryType === "text" && (
          <TextEntryForm value={textContent} onChange={setTextContent} />
        )}

        {entryType === "audio" && (
          <AudioRecorder
            onRecorded={(blob, mimeType) => {
              audioBlobRef.current = { blob, mimeType };
            }}
          />
        )}

        {entryType === "picture" && (
          <MediaUploader
            accept="image/*"
            mediaType="picture"
            onFileSelected={(file) => {
              mediaFileRef.current = file;
            }}
          />
        )}

        {entryType === "video" && (
          <MediaUploader
            accept="video/*"
            mediaType="video"
            onFileSelected={(file) => {
              mediaFileRef.current = file;
            }}
          />
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Entry"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
