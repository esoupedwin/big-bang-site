"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Daily Brief", href: "/daily-brief", teId: "nav-daily-brief" },
  { label: "Explore",     href: "/explore",      teId: "nav-explore"     },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex w-full sm:w-auto sm:justify-center">
        {TABS.map(({ label, href, teId }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              data-te-id={teId}
              className={`flex-1 sm:flex-none px-6 sm:px-16 py-3 text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                  : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
