import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
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

  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also fetch profiles to get usernames where available
  const { data: profiles } = await supabase.from("profiles").select("id, username");

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.username as string])
  );

  const result = users.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    username: profileMap.get(u.id) ?? null,
    created_at: u.created_at,
  }));

  return NextResponse.json(result);
}
