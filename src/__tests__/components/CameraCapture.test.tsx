import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CameraCapture from "@/components/CameraCapture";

vi.mock("@/lib/media", () => ({
  getSupportedVideoMimeType: () => "video/webm",
}));

describe("CameraCapture", () => {
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

    globalThis.URL.createObjectURL = vi.fn().mockReturnValue("blob:test-camera");
    globalThis.URL.revokeObjectURL = vi.fn();

    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      writable: true,
      configurable: true,
    });

    // Mock HTMLVideoElement.play
    HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  });

  // Initial state
  it("shows open camera button in picture mode", () => {
    render(<CameraCapture mode="picture" onCaptured={vi.fn()} />);
    expect(screen.getByRole("button", { name: /open camera to take photo/i })).toBeInTheDocument();
  });

  it("shows open camera button in video mode", () => {
    render(<CameraCapture mode="video" onCaptured={vi.fn()} />);
    expect(screen.getByRole("button", { name: /open camera to record video/i })).toBeInTheDocument();
  });

  // Camera access
  it("requests camera access when opening in picture mode", async () => {
    const user = userEvent.setup();
    render(<CameraCapture mode="picture" onCaptured={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /open camera/i }));

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: "environment" },
        audio: false,
      });
    });
  });

  it("requests camera + audio in video mode", async () => {
    const user = userEvent.setup();
    render(<CameraCapture mode="video" onCaptured={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /open camera/i }));

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: "environment" },
        audio: true,
      });
    });
  });

  it("shows error when camera access fails", async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Not allowed")
    );

    const user = userEvent.setup();
    render(<CameraCapture mode="picture" onCaptured={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /open camera/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not access camera/i)).toBeInTheDocument();
    });
  });

  // Picture mode controls
  it("shows Take Photo button when streaming in picture mode", async () => {
    const user = userEvent.setup();
    render(<CameraCapture mode="picture" onCaptured={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /open camera/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /take photo/i })).toBeInTheDocument();
    });
  });

  it("shows Cancel button when streaming", async () => {
    const user = userEvent.setup();
    render(<CameraCapture mode="picture" onCaptured={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /open camera/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });
  });

  it("calls onCaptured after taking a photo", async () => {
    const onCaptured = vi.fn();
    const testBlob = new Blob(["photo-data"], { type: "image/jpeg" });

    // Mock canvas toBlob
    HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation(function (
      this: HTMLCanvasElement,
      callback: BlobCallback
    ) {
      callback(testBlob);
    });
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", { value: 640, configurable: true });
    Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", { value: 480, configurable: true });

    const user = userEvent.setup();
    render(<CameraCapture mode="picture" onCaptured={onCaptured} />);

    await user.click(screen.getByRole("button", { name: /open camera/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /take photo/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /take photo/i }));

    await waitFor(() => {
      expect(onCaptured).toHaveBeenCalledWith(testBlob, "image/jpeg");
    });
  });

  // Video mode controls
  it("shows Start Recording button when streaming in video mode", async () => {
    const user = userEvent.setup();
    render(<CameraCapture mode="video" onCaptured={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /open camera/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /start recording/i })).toBeInTheDocument();
    });
  });

  it("shows Stop Recording button while recording video", async () => {
    const user = userEvent.setup();
    render(<CameraCapture mode="video" onCaptured={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /open camera/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /start recording/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /start recording/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /stop recording/i })).toBeInTheDocument();
    });
  });

  // Retake
  it("shows Retake button after capture", async () => {
    const testBlob = new Blob(["photo-data"], { type: "image/jpeg" });
    HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation(function (
      this: HTMLCanvasElement,
      callback: BlobCallback
    ) {
      callback(testBlob);
    });
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", { value: 640, configurable: true });
    Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", { value: 480, configurable: true });

    const user = userEvent.setup();
    render(<CameraCapture mode="picture" onCaptured={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /open camera/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /take photo/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /take photo/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /retake/i })).toBeInTheDocument();
    });
  });

  it("shows captured image preview", async () => {
    const testBlob = new Blob(["photo-data"], { type: "image/jpeg" });
    HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation(function (
      this: HTMLCanvasElement,
      callback: BlobCallback
    ) {
      callback(testBlob);
    });
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", { value: 640, configurable: true });
    Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", { value: 480, configurable: true });

    const user = userEvent.setup();
    render(<CameraCapture mode="picture" onCaptured={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /open camera/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /take photo/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /take photo/i }));

    await waitFor(() => {
      expect(screen.getByText(/captured/i)).toBeInTheDocument();
    });
  });

  it("hides open camera button once streaming", async () => {
    const user = userEvent.setup();
    render(<CameraCapture mode="picture" onCaptured={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /open camera/i }));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /open camera/i })).not.toBeInTheDocument();
    });
  });
});
