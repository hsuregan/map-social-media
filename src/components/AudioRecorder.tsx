"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getSupportedMimeType } from "@/lib/media";

interface AudioRecorderProps {
  onRecorded: (blob: Blob, mimeType: string) => void;
}

export default function AudioRecorder({ onRecorded }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [stopStream, audioUrl]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(url);
        onRecorded(blob, mimeType);
        stopStream();
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-error-bg p-3 text-sm text-error-fg">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-destructive-hover"
          >
            <span className="inline-block h-3 w-3 rounded-full bg-white" />
            {audioUrl ? "Re-record" : "Start Recording"}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <span className="inline-block h-3 w-3 rounded-sm bg-white" />
            Stop Recording
          </button>
        )}
        {recording && (
          <span className="text-sm text-destructive animate-pulse">
            Recording...
          </span>
        )}
      </div>

      {audioUrl && (
        <div>
          <p className="mb-2 text-sm font-medium text-stone-700">Preview:</p>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
    </div>
  );
}
