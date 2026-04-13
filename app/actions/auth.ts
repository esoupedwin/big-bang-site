"use server";

import { signIn, signOut } from "@/lib/auth";

export async function googleSignIn() {
  await signIn("google");
}

export async function handleSignOut() {
  await signOut();
}
