import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { googleSignIn } from "./actions/auth";
import { runMigrations } from "@/lib/migrate";
import { isOnboardingCompleted } from "@/lib/preferences";
import { AsciiAnimation } from "./components/AsciiAnimation";
import { GoogleIcon } from "./components/GoogleIcon";

export default async function Home() {
  const session = await auth();
  if (session?.user?.email) {
    await runMigrations();
    const done = await isOnboardingCompleted(session.user.email);
    redirect(done ? "/daily-brief" : "/onboarding");
  }

  return (
    <main className="relative flex-1 overflow-hidden bg-white dark:bg-zinc-950">
      <AsciiAnimation />
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-5xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">
            THIRD EYE
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm">
            Track the global developments that matter most to you. See what changed. Understand why it matters. Stay ahead of what comes next.
          </p>
          <form action={googleSignIn}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-black border border-zinc-700 rounded-lg hover:bg-zinc-900 transition-colors shadow-sm"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
