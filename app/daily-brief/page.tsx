import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DailyBriefPage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Daily Brief</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Coming soon.</p>
      </div>
    </main>
  );
}
