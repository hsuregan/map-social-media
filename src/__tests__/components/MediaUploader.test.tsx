import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MediaUploader from "@/components/MediaUploader";

describe("MediaUploader", () => {
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCreateObjectURL = vi.fn().mockReturnValue("blob:http://localhost/test-blob");
    mockRevokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = mockCreateObjectURL;
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL;
  });

  it("renders choose button for picture mode", () => {
    render(<MediaUploader accept="image/*" mediaType="picture" onFileSelected={vi.fn()} />);
    expect(screen.getByRole("button", { name: /choose an image/i })).toBeInTheDocument();
  });

  it("renders choose button for video mode", () => {
    render(<MediaUploader accept="video/*" mediaType="video" onFileSelected={vi.fn()} />);
    expect(screen.getByRole("button", { name: /choose a video/i })).toBeInTheDocument();
  });

  it("has a hidden file input", () => {
    const { container } = render(
      <MediaUploader accept="image/*" mediaType="picture" onFileSelected={vi.fn()} />
    );
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("hidden");
  });

  it("accepts the correct file types", () => {
    const { container } = render(
      <MediaUploader accept="image/*" mediaType="picture" onFileSelected={vi.fn()} />
    );
    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute("accept", "image/*");
  });

  it("calls onFileSelected when a valid file is chosen", async () => {
    const onFileSelected = vi.fn();
    const { container } = render(
      <MediaUploader accept="image/*" mediaType="picture" onFileSelected={onFileSelected} />
    );

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it("shows filename after selection", async () => {
    const { container } = render(
      <MediaUploader accept="image/*" mediaType="picture" onFileSelected={vi.fn()} />
    );

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/selected: photo\.jpg/i)).toBeInTheDocument();
  });

  it("shows error for files over 50MB", () => {
    const onFileSelected = vi.fn();
    const { container } = render(
      <MediaUploader accept="image/*" mediaType="picture" onFileSelected={onFileSelected} />
    );

    const bigFile = new File(["x"], "big.jpg", { type: "image/jpeg" });
    Object.defineProperty(bigFile, "size", { value: 51 * 1024 * 1024 });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(screen.getByText(/file must be under 50mb/i)).toBeInTheDocument();
    expect(onFileSelected).not.toHaveBeenCalled();
  });

  it("creates preview URL for selected file", () => {
    const { container } = render(
      <MediaUploader accept="image/*" mediaType="picture" onFileSelected={vi.fn()} />
    );

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
  });

  it("shows image preview for picture type", () => {
    const { container } = render(
      <MediaUploader accept="image/*" mediaType="picture" onFileSelected={vi.fn()} />
    );

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByAltText("Preview")).toBeInTheDocument();
  });

  it("revokes previous URL when selecting a new file", () => {
    const { container } = render(
      <MediaUploader accept="image/*" mediaType="picture" onFileSelected={vi.fn()} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const file1 = new File(["1"], "a.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file1] } });

    const file2 = new File(["2"], "b.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file2] } });

    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/test-blob");
  });
});
