import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";

export async function DELETE() {
  const session = await auth();
  if (!(await isAdmin(session?.user?.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await sql`
    UPDATE user_preferences p
    SET    onboarding_completed = FALSE
    FROM   users u
    WHERE  p.user_id = u.id
      AND  u.email   = ${session!.user!.email!}
  `;

  return NextResponse.json({ ok: true });
}
