import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { AuthHeader } from "./components/AuthHeader";
import { ThemeProvider } from "./components/ThemeProvider";
import type { Theme } from "@/lib/preferences";
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
  const jar = await cookies();
  const theme = (jar.get("theme")?.value ?? "system") as Theme;

  // Apply dark class server-side to avoid flash on dark/light preferences.
  // For "system" the client-side ThemeProvider takes over.
  const initialDark = theme === "dark";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased${initialDark ? " dark" : ""}`}
    >
      <body className="h-full flex flex-col">
        <ThemeProvider theme={theme} />
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5">
          <div className="max-w-2xl mx-auto flex items-center justify-end">
            <Suspense>
              <AuthHeader />
            </Suspense>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
