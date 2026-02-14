import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupportedMimeType, getSupportedVideoMimeType } from "@/lib/media";

describe("getSupportedMimeType (audio)", () => {
  beforeEach(() => {
    // @ts-expect-error - mocking global MediaRecorder
    globalThis.MediaRecorder = { isTypeSupported: vi.fn() };
  });

  it("returns the first supported audio type", () => {
    (MediaRecorder.isTypeSupported as ReturnType<typeof vi.fn>).mockImplementation(
      (type: string) => type === "audio/webm;codecs=opus"
    );
    expect(getSupportedMimeType()).toBe("audio/webm;codecs=opus");
  });

  it("skips unsupported types and returns the next match", () => {
    (MediaRecorder.isTypeSupported as ReturnType<typeof vi.fn>).mockImplementation(
      (type: string) => type === "audio/ogg;codecs=opus"
    );
    expect(getSupportedMimeType()).toBe("audio/ogg;codecs=opus");
  });

  it("returns fallback audio/webm when none supported", () => {
    (MediaRecorder.isTypeSupported as ReturnType<typeof vi.fn>).mockReturnValue(false);
    expect(getSupportedMimeType()).toBe("audio/webm");
  });
});

describe("getSupportedVideoMimeType", () => {
  beforeEach(() => {
    // @ts-expect-error - mocking global MediaRecorder
    globalThis.MediaRecorder = { isTypeSupported: vi.fn() };
  });

  it("returns the first supported video type", () => {
    (MediaRecorder.isTypeSupported as ReturnType<typeof vi.fn>).mockImplementation(
      (type: string) => type === "video/webm;codecs=vp9,opus"
    );
    expect(getSupportedVideoMimeType()).toBe("video/webm;codecs=vp9,opus");
  });

  it("returns video/mp4 when only mp4 is supported", () => {
    (MediaRecorder.isTypeSupported as ReturnType<typeof vi.fn>).mockImplementation(
      (type: string) => type === "video/mp4"
    );
    expect(getSupportedVideoMimeType()).toBe("video/mp4");
  });

  it("returns fallback video/webm when none supported", () => {
    (MediaRecorder.isTypeSupported as ReturnType<typeof vi.fn>).mockReturnValue(false);
    expect(getSupportedVideoMimeType()).toBe("video/webm");
  });
});
