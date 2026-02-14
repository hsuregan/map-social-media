import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewEntryPage from "@/app/dashboard/new/page";
import { createMockSupabaseClient } from "../mocks/supabase";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh, back: mockBack }),
}));

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

// Mock useGeolocation
vi.mock("@/hooks/useGeolocation", () => ({
  useGeolocation: () => ({
    latitude: 40.7128,
    longitude: -74.006,
    loading: false,
    error: null,
  }),
}));

// Mock child components to isolate the page
vi.mock("@/components/TextEntryForm", () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea data-testid="text-form" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock("@/components/AudioRecorder", () => ({
  default: ({ onRecorded }: { onRecorded: (blob: Blob, mime: string) => void }) => (
    <button
      data-testid="audio-recorder"
      onClick={() => onRecorded(new Blob(["audio"]), "audio/webm")}
    >
      Record Audio
    </button>
  ),
}));

vi.mock("@/components/MediaUploader", () => ({
  default: ({ onFileSelected }: { onFileSelected: (file: File) => void }) => (
    <button
      data-testid="media-uploader"
      onClick={() =>
        onFileSelected(new File(["img"], "photo.jpg", { type: "image/jpeg" }))
      }
    >
      Choose Media
    </button>
  ),
}));

vi.mock("@/components/CameraCapture", () => ({
  default: ({ onCaptured }: { onCaptured: (blob: Blob, mime: string) => void }) => (
    <button
      data-testid="camera-capture"
      onClick={() => onCaptured(new Blob(["video"]), "video/webm")}
    >
      Capture
    </button>
  ),
}));

vi.mock("@/lib/media", () => ({
  getFileExtension: (mime: string) => mime.split("/")[1] || "bin",
}));

describe("NewEntryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    // Setup chainable insert
    const insertBuilder = {
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(resolve),
    };
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue(insertBuilder),
    } as never);
    mockSupabase.storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: "test" }, error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as never);
  });

  // Rendering
  it("renders the page heading", () => {
    render(<NewEntryPage />);
    expect(screen.getByRole("heading", { name: /new journal entry/i })).toBeInTheDocument();
  });

  it("shows title input", () => {
    render(<NewEntryPage />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it("shows entry type buttons", () => {
    render(<NewEntryPage />);
    expect(screen.getByRole("button", { name: /^text$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^audio$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^picture$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^video$/i })).toBeInTheDocument();
  });

  it("shows Save Entry and Cancel buttons", () => {
    render(<NewEntryPage />);
    expect(screen.getByRole("button", { name: /save entry/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("shows location when available", () => {
    render(<NewEntryPage />);
    expect(screen.getByText(/location captured/i)).toBeInTheDocument();
    expect(screen.getByText(/40\.7128/)).toBeInTheDocument();
  });

  it("shows public checkbox", () => {
    render(<NewEntryPage />);
    expect(screen.getByLabelText(/make this entry public/i)).toBeInTheDocument();
  });

  // Type switching
  it("shows text form when text type selected", () => {
    render(<NewEntryPage />);
    expect(screen.getByTestId("text-form")).toBeInTheDocument();
  });

  it("shows audio recorder when audio type selected", async () => {
    const user = userEvent.setup();
    render(<NewEntryPage />);

    await user.click(screen.getByRole("button", { name: /^audio$/i }));
    expect(screen.getByTestId("audio-recorder")).toBeInTheDocument();
  });

  it("shows media uploader when picture type selected", async () => {
    const user = userEvent.setup();
    render(<NewEntryPage />);

    await user.click(screen.getByRole("button", { name: /^picture$/i }));
    expect(screen.getByTestId("media-uploader")).toBeInTheDocument();
  });

  it("shows upload/camera toggle for picture/video", async () => {
    const user = userEvent.setup();
    render(<NewEntryPage />);

    await user.click(screen.getByRole("button", { name: /^picture$/i }));
    expect(screen.getByRole("button", { name: /upload file/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /use camera/i })).toBeInTheDocument();
  });

  // Validation
  it("shows error when title is only whitespace", async () => {
    const user = userEvent.setup();
    render(<NewEntryPage />);

    // Type a space to bypass native `required` validation, but fail the trim() check
    await user.type(screen.getByLabelText(/title/i), " ");
    await user.click(screen.getByRole("button", { name: /save entry/i }));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it("shows error when text content is empty for text entry", async () => {
    const user = userEvent.setup();
    render(<NewEntryPage />);

    await user.type(screen.getByLabelText(/title/i), "My Entry");
    await user.click(screen.getByRole("button", { name: /save entry/i }));

    await waitFor(() => {
      expect(screen.getByText(/text content is required/i)).toBeInTheDocument();
    });
  });

  it("shows error when no audio recorded", async () => {
    const user = userEvent.setup();
    render(<NewEntryPage />);

    await user.type(screen.getByLabelText(/title/i), "My Audio");
    await user.click(screen.getByRole("button", { name: /^audio$/i }));
    await user.click(screen.getByRole("button", { name: /save entry/i }));

    await waitFor(() => {
      expect(screen.getByText(/please record audio/i)).toBeInTheDocument();
    });
  });

  it("shows error when no media selected for picture", async () => {
    const user = userEvent.setup();
    render(<NewEntryPage />);

    await user.type(screen.getByLabelText(/title/i), "My Photo");
    await user.click(screen.getByRole("button", { name: /^picture$/i }));
    await user.click(screen.getByRole("button", { name: /save entry/i }));

    await waitFor(() => {
      expect(screen.getByText(/please select a file or capture/i)).toBeInTheDocument();
    });
  });

  // Successful submission
  it("saves a text entry and redirects", async () => {
    const user = userEvent.setup();
    render(<NewEntryPage />);

    await user.type(screen.getByLabelText(/title/i), "My Text Entry");
    await user.type(screen.getByTestId("text-form"), "Entry content here");
    await user.click(screen.getByRole("button", { name: /save entry/i }));

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith("journal_entries");
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("uploads audio and saves entry", async () => {
    const user = userEvent.setup();
    render(<NewEntryPage />);

    await user.type(screen.getByLabelText(/title/i), "My Audio");
    await user.click(screen.getByRole("button", { name: /^audio$/i }));
    await user.click(screen.getByTestId("audio-recorder")); // triggers onRecorded
    await user.click(screen.getByRole("button", { name: /save entry/i }));

    await waitFor(() => {
      expect(mockSupabase.storage.from).toHaveBeenCalledWith("journal-media");
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("navigates back on cancel", async () => {
    const user = userEvent.setup();
    render(<NewEntryPage />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockBack).toHaveBeenCalled();
  });

  it("shows saving state while submitting", async () => {
    let resolveInsert: (v: unknown) => void;
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        then: (resolve: (v: unknown) => unknown) =>
          new Promise((r) => {
            resolveInsert = r;
          }).then(resolve),
      }),
    } as never);

    const user = userEvent.setup();
    render(<NewEntryPage />);

    await user.type(screen.getByLabelText(/title/i), "My Entry");
    await user.type(screen.getByTestId("text-form"), "Content");
    await user.click(screen.getByRole("button", { name: /save entry/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    });

    resolveInsert!({ data: null, error: null });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });
});
