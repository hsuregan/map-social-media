import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AudioRecorder from "@/components/AudioRecorder";

// Mock the media module
vi.mock("@/lib/media", () => ({
  getSupportedMimeType: () => "audio/webm",
}));

describe("AudioRecorder", () => {
  let mockStream: MediaStream;
  let mockMediaRecorder: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    ondataavailable: ((e: { data: Blob }) => void) | null;
    onstop: (() => void) | null;
  };

  beforeEach(() => {
    mockStream = {
      getTracks: () => [{ stop: vi.fn() }],
    } as unknown as MediaStream;

    mockMediaRecorder = {
      start: vi.fn(),
      stop: vi.fn(),
      ondataavailable: null,
      onstop: null,
    };

    // @ts-expect-error - mock MediaRecorder constructor
    globalThis.MediaRecorder = vi.fn().mockImplementation(function () { return mockMediaRecorder; });
    // @ts-expect-error - static method
    globalThis.MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);

    globalThis.URL.createObjectURL = vi.fn().mockReturnValue("blob:test-audio");
    globalThis.URL.revokeObjectURL = vi.fn();

    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      writable: true,
      configurable: true,
    });
  });

  it("renders Start Recording button initially", () => {
    render(<AudioRecorder onRecorded={vi.fn()} />);
    expect(screen.getByRole("button", { name: /start recording/i })).toBeInTheDocument();
  });

  it("does not show Stop Recording button initially", () => {
    render(<AudioRecorder onRecorded={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /stop recording/i })).not.toBeInTheDocument();
  });

  it("shows Stop Recording button after starting", async () => {
    const user = userEvent.setup();
    render(<AudioRecorder onRecorded={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /start recording/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /stop recording/i })).toBeInTheDocument();
    });
  });

  it("shows Recording indicator while recording", async () => {
    const user = userEvent.setup();
    render(<AudioRecorder onRecorded={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /start recording/i }));

    await waitFor(() => {
      expect(screen.getByText(/recording\.\.\./i)).toBeInTheDocument();
    });
  });

  it("requests microphone access on start", async () => {
    const user = userEvent.setup();
    render(<AudioRecorder onRecorded={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /start recording/i }));

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    });
  });

  it("shows error when microphone access fails", async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Permission denied")
    );

    const user = userEvent.setup();
    render(<AudioRecorder onRecorded={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /start recording/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not access microphone/i)).toBeInTheDocument();
    });
  });

  it("calls onRecorded with blob and mimeType after stopping", async () => {
    const onRecorded = vi.fn();
    const user = userEvent.setup();
    render(<AudioRecorder onRecorded={onRecorded} />);

    await user.click(screen.getByRole("button", { name: /start recording/i }));

    await waitFor(() => {
      expect(mockMediaRecorder.start).toHaveBeenCalled();
    });

    // Simulate data available
    mockMediaRecorder.ondataavailable!({
      data: new Blob(["audio-data"], { type: "audio/webm" }),
    });

    // Simulate stop
    mockMediaRecorder.stop.mockImplementation(() => {
      mockMediaRecorder.onstop!();
    });

    await user.click(screen.getByRole("button", { name: /stop recording/i }));

    await waitFor(() => {
      expect(onRecorded).toHaveBeenCalledWith(expect.any(Blob), "audio/webm");
    });
  });

  it("shows audio preview after recording", async () => {
    const user = userEvent.setup();
    render(<AudioRecorder onRecorded={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /start recording/i }));

    await waitFor(() => {
      expect(mockMediaRecorder.start).toHaveBeenCalled();
    });

    mockMediaRecorder.ondataavailable!({
      data: new Blob(["audio-data"], { type: "audio/webm" }),
    });

    mockMediaRecorder.stop.mockImplementation(() => {
      mockMediaRecorder.onstop!();
    });

    await user.click(screen.getByRole("button", { name: /stop recording/i }));

    await waitFor(() => {
      expect(screen.getByText(/preview/i)).toBeInTheDocument();
    });
  });

  it("shows Re-record button after recording is complete", async () => {
    const user = userEvent.setup();
    render(<AudioRecorder onRecorded={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /start recording/i }));

    await waitFor(() => {
      expect(mockMediaRecorder.start).toHaveBeenCalled();
    });

    mockMediaRecorder.ondataavailable!({
      data: new Blob(["audio-data"], { type: "audio/webm" }),
    });

    mockMediaRecorder.stop.mockImplementation(() => {
      mockMediaRecorder.onstop!();
    });

    await user.click(screen.getByRole("button", { name: /stop recording/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /re-record/i })).toBeInTheDocument();
    });
  });

  it("starts a new MediaRecorder session on start", async () => {
    const user = userEvent.setup();
    render(<AudioRecorder onRecorded={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /start recording/i }));

    await waitFor(() => {
      expect(MediaRecorder).toHaveBeenCalledWith(mockStream, { mimeType: "audio/webm" });
      expect(mockMediaRecorder.start).toHaveBeenCalled();
    });
  });
});
