"use client";

import { useState, useRef, useEffect } from "react";

interface MediaUploaderProps {
  accept: string;
  mediaType: "picture" | "video";
  onFileSelected: (file: File) => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function MediaUploader({
  accept,
  mediaType,
  onFileSelected,
}: MediaUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("File must be under 50MB.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setFileName(file.name);
    onFileSelected(file);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-error-bg p-3 text-sm text-error-fg">
          {error}
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border-2 border-dashed border-sand px-6 py-4 text-sm font-medium text-stone-700 hover:border-accent hover:text-accent"
        >
          {fileName
            ? `Selected: ${fileName}`
            : `Choose ${mediaType === "picture" ? "an image" : "a video"}`}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {preview && mediaType === "picture" && (
        <div>
          <p className="mb-2 text-sm font-medium text-stone-700">Preview:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="max-h-64 rounded-xl object-contain"
          />
        </div>
      )}

      {preview && mediaType === "video" && (
        <div>
          <p className="mb-2 text-sm font-medium text-stone-700">Preview:</p>
          <video controls src={preview} className="max-h-64 rounded-xl" />
        </div>
      )}
    </div>
  );
}
