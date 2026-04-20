import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

// GET — check if the coachmark walkthrough has been completed for this user
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ done: false });

  const rows = await sql`
    SELECT p.coachmark_done
    FROM user_preferences p
    JOIN users u ON p.user_id = u.id
    WHERE u.email = ${session.user.email}
  `;
  const done = (rows[0]?.coachmark_done as boolean) ?? false;
  return NextResponse.json({ done });
}

// POST — mark the coachmark walkthrough as done for this user
export async function POST() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ ok: false }, { status: 401 });

  await sql`
    INSERT INTO user_preferences (user_id, coachmark_done)
    SELECT id, TRUE FROM users WHERE email = ${session.user.email}
    ON CONFLICT (user_id) DO UPDATE
      SET coachmark_done = TRUE, updated_at = NOW()
  `;
  return NextResponse.json({ ok: true });
}
