import { describe, it, expect } from "vitest";
import { getFileExtension } from "@/lib/media";

describe("getFileExtension", () => {
  it("maps audio/webm to webm", () => {
    expect(getFileExtension("audio/webm")).toBe("webm");
  });

  it("maps audio/ogg to ogg", () => {
    expect(getFileExtension("audio/ogg")).toBe("ogg");
  });

  it("maps audio/mp4 to m4a", () => {
    expect(getFileExtension("audio/mp4")).toBe("m4a");
  });

  it("maps image/jpeg to jpg", () => {
    expect(getFileExtension("image/jpeg")).toBe("jpg");
  });

  it("maps image/png to png", () => {
    expect(getFileExtension("image/png")).toBe("png");
  });

  it("maps video/mp4 to mp4", () => {
    expect(getFileExtension("video/mp4")).toBe("mp4");
  });

  it("maps video/quicktime to mov", () => {
    expect(getFileExtension("video/quicktime")).toBe("mov");
  });

  it("strips codec parameters before mapping", () => {
    expect(getFileExtension("video/webm;codecs=vp9,opus")).toBe("webm");
  });

  it("strips codec parameters with spaces", () => {
    expect(getFileExtension("audio/webm; codecs=opus")).toBe("webm");
  });

  it("falls back to subtype for unknown MIME types", () => {
    expect(getFileExtension("application/pdf")).toBe("pdf");
  });

  it("falls back to bin when no subtype", () => {
    expect(getFileExtension("")).toBe("bin");
  });
});
