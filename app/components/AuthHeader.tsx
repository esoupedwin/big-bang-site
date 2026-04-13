import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { googleSignIn, handleSignOut } from "@/app/actions/auth";
import { GoogleIcon } from "./GoogleIcon";

export async function AuthHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="flex items-center gap-3">
      {user ? (
        <>
          <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name ?? "User avatar"}
                width={28}
                height={28}
                className="rounded-full"
              />
            )}
            <span className="text-sm text-zinc-600 dark:text-zinc-300 hidden sm:block">
              {user.name}
            </span>
          </Link>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
            >
              Sign out
            </button>
          </form>
        </>
      ) : (
        <form action={googleSignIn}>
          <button
            type="submit"
            className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
        </form>
      )}
    </div>
  );
}
