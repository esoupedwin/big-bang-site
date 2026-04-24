import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { getUserPreferences, type Theme } from "@/lib/preferences";
import { saveTheme } from "@/app/actions/preferences";
import { AudioBriefSettings } from "@/app/components/AudioBriefSettings";

const THEMES: { value: Theme; label: string; description: string }[] = [
  { value: "light", label: "Light", description: "Always light" },
  { value: "dark",  label: "Dark",  description: "Always dark"  },
  { value: "system", label: "System", description: "Follow OS setting" },
];

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const { user } = session;
  const prefs = await getUserPreferences(user.email!);

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to feed
        </Link>

        {/* User info */}
        <div className="flex items-center gap-4">
          {user.image && (
            <Image
              src={user.image}
              alt={user.name ?? "Avatar"}
              width={56}
              height={56}
              className="rounded-full"
            />
          )}
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-white">{user.name}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
          </div>
        </div>

        <hr className="border-zinc-200 dark:border-zinc-800" />

        {/* Preferences */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
            Preferences
          </h2>

          <div className="space-y-6">
            {/* Theme */}
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white mb-3">Theme</p>
              <div className="flex gap-3">
                {THEMES.map(({ value, label, description }) => {
                  const active = prefs.theme === value;
                  return (
                    <form key={value} action={saveTheme.bind(null, value)}>
                      <button
                        type="submit"
                        className={`px-4 py-2.5 rounded-lg border text-sm text-left transition-colors w-28 ${
                          active
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white font-medium"
                            : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
                        }`}
                      >
                        <span className="block font-medium">{label}</span>
                        <span className="block text-xs opacity-60 mt-0.5">{description}</span>
                      </button>
                    </form>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <hr className="border-zinc-200 dark:border-zinc-800" />

        {/* Audio Brief */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
            Audio Brief
          </h2>
          <AudioBriefSettings
            initialGender={prefs.audio_brief_voice_gender}
            initialTone={prefs.audio_brief_voice_tone}
          />
        </section>

        <hr className="border-zinc-200 dark:border-zinc-800" />

        {/* Daily Brief */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
            Daily Brief
          </h2>

          <Link
            href="/profile/coverages"
            className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group"
          >
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Coverages</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Choose what geopolitical issues to track
              </p>
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors shrink-0"
            >
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </section>

        <hr className="border-zinc-200 dark:border-zinc-800" />

        {/* Achievements */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
            Achievements
          </h2>

          <Link
            href="/profile/badges"
            className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group"
          >
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Badges</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                View earned badges and available achievements
              </p>
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors shrink-0"
            >
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </section>

      </div>
    </main>
  );
}
