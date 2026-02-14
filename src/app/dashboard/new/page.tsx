"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getFileExtension } from "@/lib/media";
import { EntryType } from "@/lib/types";
import { useGeolocation } from "@/hooks/useGeolocation";
import TextEntryForm from "@/components/TextEntryForm";
import AudioRecorder from "@/components/AudioRecorder";
import MediaUploader from "@/components/MediaUploader";
import CameraCapture from "@/components/CameraCapture";

type MediaSource = "upload" | "camera";

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
  const [mediaSource, setMediaSource] = useState<MediaSource>("upload");
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const geo = useGeolocation();

  const audioBlobRef = useRef<{ blob: Blob; mimeType: string } | null>(null);
  const mediaFileRef = useRef<File | null>(null);
  const cameraBlobRef = useRef<{ blob: Blob; mimeType: string } | null>(null);

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
      !mediaFileRef.current &&
      !cameraBlobRef.current
    ) {
      setError("Please select a file or capture from camera before saving.");
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

      if (
        (entryType === "picture" || entryType === "video") &&
        !mediaFileRef.current &&
        cameraBlobRef.current
      ) {
        const { blob, mimeType } = cameraBlobRef.current;
        const ext = getFileExtension(mimeType);
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("journal-media")
          .upload(path, blob, { contentType: mimeType });
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
          latitude: geo.latitude,
          longitude: geo.longitude,
          public: isPublic,
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
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink">
        New Journal Entry
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-error-bg p-3 text-sm text-error-fg">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-stone-700"
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
            className="mt-1 block w-full rounded-md border border-sand bg-ivory px-3 py-2 text-ink shadow-[var(--shadow-warm-sm)] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Entry Type
          </label>
          <div className="flex gap-2">
            {entryTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setEntryType(t.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  entryType === t.value
                    ? "bg-accent text-white"
                    : "bg-linen text-stone-700 hover:bg-sand"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-sm text-stone-500">
          {geo.loading ? (
            <span>Detecting location...</span>
          ) : geo.latitude !== null && geo.longitude !== null ? (
            <span className="text-success-fg">
              Location captured ({geo.latitude.toFixed(4)}, {geo.longitude.toFixed(4)})
            </span>
          ) : (
            <span>No location available</span>
          )}
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

        {(entryType === "picture" || entryType === "video") && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMediaSource("upload");
                  cameraBlobRef.current = null;
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  mediaSource === "upload"
                    ? "bg-ink text-white"
                    : "bg-linen text-stone-700 hover:bg-sand"
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => {
                  setMediaSource("camera");
                  mediaFileRef.current = null;
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  mediaSource === "camera"
                    ? "bg-ink text-white"
                    : "bg-linen text-stone-700 hover:bg-sand"
                }`}
              >
                Use Camera
              </button>
            </div>

            {mediaSource === "upload" && entryType === "picture" && (
              <MediaUploader
                accept="image/*"
                mediaType="picture"
                onFileSelected={(file) => {
                  mediaFileRef.current = file;
                }}
              />
            )}
            {mediaSource === "upload" && entryType === "video" && (
              <MediaUploader
                accept="video/*"
                mediaType="video"
                onFileSelected={(file) => {
                  mediaFileRef.current = file;
                }}
              />
            )}
            {mediaSource === "camera" && (
              <CameraCapture
                mode={entryType}
                onCaptured={(blob, mimeType) => {
                  cameraBlobRef.current = { blob, mimeType };
                }}
              />
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            id="public"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-sand"
          />
          <label htmlFor="public" className="text-sm text-stone-700">
            Make this entry public
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-warm-sm)] hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Entry"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-sand px-6 py-2.5 text-sm font-medium text-stone-700 hover:bg-linen"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
