import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const { userId } = await request.json();

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Delete media files from storage
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("media_url")
    .eq("user_id", userId);

  if (entries) {
    const mediaPaths = entries
      .map((e) => e.media_url)
      .filter((url): url is string => url !== null);
    if (mediaPaths.length > 0) {
      await supabase.storage.from("journal-media").remove(mediaPaths);
    }
  }

  // Delete journal entries
  await supabase.from("journal_entries").delete().eq("user_id", userId);

  // Delete profile
  await supabase.from("profiles").delete().eq("id", userId);

  // Delete auth user
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
