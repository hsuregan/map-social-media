"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getSupportedVideoMimeType } from "@/lib/media";

interface CameraCaptureProps {
  mode: "picture" | "video";
  onCaptured: (blob: Blob, mimeType: string) => void;
}

export default function CameraCapture({ mode, onCaptured }: CameraCaptureProps) {
  const [streaming, setStreaming] = useState(false);
  const [recording, setRecording] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreaming(false);
    setRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [stopStream, capturedUrl]);

  const startCamera = async () => {
    setError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: "environment" },
        audio: mode === "video",
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      setError("Could not access camera. Please check permissions.");
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    stopStream();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        if (capturedUrl) URL.revokeObjectURL(capturedUrl);
        const url = URL.createObjectURL(blob);
        setCapturedUrl(url);
        onCaptured(blob, "image/jpeg");
      },
      "image/jpeg",
      0.9
    );
  };

  const startVideoRecording = () => {
    if (!streamRef.current) return;

    const mimeType = getSupportedVideoMimeType();
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
      const url = URL.createObjectURL(blob);
      setCapturedUrl(url);
      onCaptured(blob, mimeType);
      stopStream();
    };

    recorder.start();
    setRecording(true);
  };

  const stopVideoRecording = () => {
    if (recorderRef.current && recording) {
      recorderRef.current.stop();
    }
  };

  const retake = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    startCamera();
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-error-bg p-3 text-sm text-error-fg">
          {error}
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Live camera feed — always mounted so the ref is available */}
      <div className={streaming && !capturedUrl ? "" : "hidden"}>
        <video
          ref={videoRef}
          muted
          playsInline
          className="max-h-80 w-full rounded-xl bg-ink object-contain"
        />
        <div className="mt-3 flex items-center gap-3">
            {mode === "picture" && (
              <button
                type="button"
                onClick={takePhoto}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
              >
                Take Photo
              </button>
            )}
            {mode === "video" && !recording && (
              <button
                type="button"
                onClick={startVideoRecording}
                className="flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-destructive-hover"
              >
                <span className="inline-block h-3 w-3 rounded-full bg-white" />
                Start Recording
              </button>
            )}
            {mode === "video" && recording && (
              <>
                <button
                  type="button"
                  onClick={stopVideoRecording}
                  className="flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  <span className="inline-block h-3 w-3 rounded-sm bg-white" />
                  Stop Recording
                </button>
                <span className="animate-pulse text-sm text-destructive">
                  Recording...
                </span>
              </>
            )}
            <button
              type="button"
              onClick={stopStream}
              className="rounded-md border border-sand px-4 py-2 text-sm font-medium text-stone-700 hover:bg-linen"
            >
              Cancel
            </button>
          </div>
        </div>

      {/* Preview of captured media */}
      {capturedUrl && (
        <div>
          <p className="mb-2 text-sm font-medium text-stone-700">Captured:</p>
          {mode === "picture" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedUrl}
              alt="Captured"
              className="max-h-64 rounded-xl object-contain"
            />
          ) : (
            <video controls src={capturedUrl} className="max-h-64 rounded-xl" />
          )}
          <button
            type="button"
            onClick={retake}
            className="mt-3 rounded-md border border-sand px-4 py-2 text-sm font-medium text-stone-700 hover:bg-linen"
          >
            Retake
          </button>
        </div>
      )}

      {/* Initial state: open camera button */}
      {!streaming && !capturedUrl && (
        <button
          type="button"
          onClick={startCamera}
          className="rounded-xl border-2 border-dashed border-sand px-6 py-4 text-sm font-medium text-stone-700 hover:border-accent hover:text-accent"
        >
          {mode === "picture" ? "Open Camera to Take Photo" : "Open Camera to Record Video"}
        </button>
      )}
    </div>
  );
}
