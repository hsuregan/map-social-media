"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface CameraCaptureProps {
  mode: "picture" | "video";
  onCaptured: (blob: Blob, mimeType: string) => void;
}

function getSupportedVideoMimeType(): string {
  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "video/webm";
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
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
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
          className="max-h-80 w-full rounded-lg bg-black object-contain"
        />
        <div className="mt-3 flex items-center gap-3">
            {mode === "picture" && (
              <button
                type="button"
                onClick={takePhoto}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Take Photo
              </button>
            )}
            {mode === "video" && !recording && (
              <button
                type="button"
                onClick={startVideoRecording}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
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
                  className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                >
                  <span className="inline-block h-3 w-3 rounded-sm bg-white" />
                  Stop Recording
                </button>
                <span className="animate-pulse text-sm text-red-600">
                  Recording...
                </span>
              </>
            )}
            <button
              type="button"
              onClick={stopStream}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>

      {/* Preview of captured media */}
      {capturedUrl && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Captured:</p>
          {mode === "picture" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedUrl}
              alt="Captured"
              className="max-h-64 rounded-lg object-contain"
            />
          ) : (
            <video controls src={capturedUrl} className="max-h-64 rounded-lg" />
          )}
          <button
            type="button"
            onClick={retake}
            className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
          className="rounded-lg border-2 border-dashed border-gray-300 px-6 py-4 text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-700"
        >
          {mode === "picture" ? "Open Camera to Take Photo" : "Open Camera to Record Video"}
        </button>
      )}
    </div>
  );
}
