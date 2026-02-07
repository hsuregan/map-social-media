export interface Profile {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export type EntryType = "text" | "audio" | "picture" | "video";

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  entry_type: EntryType;
  text_content: string | null;
  media_url: string | null;
  latitude: number | null;
  longitude: number | null;
  public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEntryPayload {
  title: string;
  entry_type: EntryType;
  text_content?: string;
  media_url?: string;
  latitude?: number;
  longitude?: number;
  public?: boolean;
}
