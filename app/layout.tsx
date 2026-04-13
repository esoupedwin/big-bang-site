import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import { AuthHeader } from "./components/AuthHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BIG BANG",
  description: "Latest news articles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
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
