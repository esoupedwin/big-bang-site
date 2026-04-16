import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { AuthHeader } from "./components/AuthHeader";
import { ThemeProvider } from "./components/ThemeProvider";
import { AppNav } from "./components/AppNav";
import { AdminTrigger } from "./components/AdminTrigger";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getUserPreferences, type Theme } from "@/lib/preferences";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BIG BANG",
  description: "Latest news articles",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [jar, session] = await Promise.all([cookies(), auth()]);
  const admin = await isAdmin(session?.user?.email);

  // Prefer DB preference for logged-in users so theme syncs across devices.
  // Fall back to cookie for guests or if DB lookup fails.
  let theme: Theme = (jar.get("theme")?.value ?? "system") as Theme;
  if (session?.user?.email) {
    try {
      const prefs = await getUserPreferences(session.user.email);
      theme = prefs.theme;
    } catch {
      // DB unreachable — cookie value is used as fallback
    }
  }

  // Apply dark class server-side to avoid flash on dark/light preferences.
  // For "system" the client-side ThemeProvider takes over.
  const initialDark = theme === "dark";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased${initialDark ? " dark" : ""}`}
    >
      <body className="h-full flex flex-col overscroll-none">
        <ThemeProvider theme={theme} />
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            {admin ? <AdminTrigger /> : <span />}
            <Suspense>
              <AuthHeader />
            </Suspense>
          </div>
        </header>
        {session && <AppNav />}
        {children}
      </body>
    </html>
  );
}
