import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getUserIdByEmail } from "@/lib/coverages";
import { sql } from "@/lib/db";

export async function DELETE() {
  const session = await auth();
  if (!(await isAdmin(session?.user?.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = await getUserIdByEmail(session!.user!.email!);
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await Promise.all([
    sql`DELETE FROM user_achievements WHERE user_id = ${userId}`,
    sql`UPDATE user_stats SET value = 0 WHERE user_id = ${userId} AND stat_key = 'article_clicks'`,
  ]);
  revalidatePath("/profile/badges");

  return NextResponse.json({ ok: true });
}
