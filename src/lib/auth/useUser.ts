"use client";

import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { forgetReader, identifyReader } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Who is signed in, shared by every component that asks (the header, the
 * account menu, lesson locks). `undefined` while Supabase is still reading the
 * stored session, then the user or null.
 */
let user: User | null | undefined = undefined;
const listeners = new Set<() => void>();
let started = false;

function start() {
  if (started) return;
  started = true;
  if (!isSupabaseConfigured()) {
    user = null;
    return;
  }
  createClient().auth.onAuthStateChange((event, session) => {
    user = session?.user ?? null;
    // Only an actual sign-out resets analytics; a visitor who was never
    // signed in keeps the same anonymous ID between visits.
    if (session?.user) identifyReader(session.user.id);
    else if (event === "SIGNED_OUT") forgetReader();
    for (const listener of listeners) listener();
  });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useUser(): User | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => user,
    () => undefined
  );
}

/**
 * Whether lessons outside the free courses are locked for this reader: only
 * once we know they are signed out, and only when sign-in is set up at all.
 */
export function useLessonsLocked(): boolean {
  return useUser() === null && isSupabaseConfigured();
}
