"use client";

import { useSyncExternalStore } from "react";
import { readStored, removeStored } from "./browserStore";
import { createClient } from "./supabase/browser";
import { isSupabaseConfigured } from "./supabase/config";

/**
 * Lesson progress, kept in the reader's account so it follows them to any
 * device. Reading never needs an account; signing in only adds tracking.
 * Rows live in the `lesson_progress` table (supabase/migrations), where
 * row-level security lets each user read and change only their own.
 */

const TABLE = "lesson_progress";
/** Where progress lived before it moved to accounts; carried over on sign-in. */
const LEGACY_KEY = "ir:progress";

/**
 * loading: the session or the saved progress is still being read.
 * signed-out: no account, so no tracking (an invitation is shown instead).
 * unavailable: signed in, but progress couldn't be loaded (e.g. the table
 * isn't set up yet), so tracking stays out of sight rather than breaking.
 */
export type ProgressStatus = "loading" | "signed-out" | "unavailable" | "ready";

interface ProgressState {
  status: ProgressStatus;
  userId: string | null;
  done: Map<string, Set<string>>;
}

const SERVER_STATE: ProgressState = { status: "loading", userId: null, done: new Map() };
let state: ProgressState = SERVER_STATE;
const listeners = new Set<() => void>();
let started = false;

function update(next: Partial<ProgressState>) {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

function start() {
  if (started) return;
  started = true;
  if (!isSupabaseConfigured()) {
    update({ status: "signed-out" });
    return;
  }
  createClient().auth.onAuthStateChange((_event, session) => {
    const userId = session?.user.id ?? null;
    if (!userId) {
      update({ status: "signed-out", userId: null, done: new Map() });
      return;
    }
    if (userId === state.userId && state.status !== "signed-out") return;
    update({ status: "loading", userId, done: new Map() });
    // Supabase calls made inside this callback can deadlock it, so load after.
    setTimeout(() => void load(userId), 0);
  });
}

async function load(userId: string) {
  const supabase = createClient();
  await importLegacy(userId);
  const { data, error } = await supabase.from(TABLE).select("section, topic");
  if (state.userId !== userId) return; // signed out or switched meanwhile
  if (error || !data) {
    update({ status: "unavailable" });
    return;
  }
  const done = new Map<string, Set<string>>();
  for (const row of data as { section: string; topic: string }[]) {
    if (!done.has(row.section)) done.set(row.section, new Set());
    done.get(row.section)!.add(row.topic);
  }
  update({ status: "ready", done });
}

/** Moves progress saved in this browser by the old tracking into the account, once. */
async function importLegacy(userId: string) {
  const raw = readStored(LEGACY_KEY);
  if (!raw) return;
  let saved: unknown;
  try {
    saved = JSON.parse(raw);
  } catch {
    removeStored(LEGACY_KEY);
    return;
  }
  const rows = Object.entries((saved ?? {}) as Record<string, unknown>).flatMap(([section, topics]) =>
    Array.isArray(topics) ? topics.filter((t): t is string => typeof t === "string").map((topic) => ({ user_id: userId, section, topic })) : []
  );
  if (rows.length > 0) {
    const { error } = await createClient()
      .from(TABLE)
      .upsert(rows, { onConflict: "user_id,section,topic", ignoreDuplicates: true });
    if (error) return; // kept, to try again next time
  }
  removeStored(LEGACY_KEY);
}

function withTopic(done: Map<string, Set<string>>, section: string, topic: string, complete: boolean) {
  const next = new Map(done);
  const topics = new Set(next.get(section));
  if (complete) topics.add(topic);
  else topics.delete(topic);
  next.set(section, topics);
  return next;
}

/** Marks a lesson complete or not. Shown straight away, saved to the account behind it. */
export async function setTopicComplete(section: string, topic: string, complete: boolean) {
  const userId = state.userId;
  if (state.status !== "ready" || !userId) return;
  update({ done: withTopic(state.done, section, topic, complete) });
  const table = createClient().from(TABLE);
  const row = { user_id: userId, section, topic };
  const { error } = complete
    ? await table.upsert(row, { onConflict: "user_id,section,topic", ignoreDuplicates: true })
    : await table.delete().match(row);
  // Not saved: put this one lesson back as it was, leaving any other changes.
  if (error && state.userId === userId) update({ done: withTopic(state.done, section, topic, !complete) });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const NONE = new Set<string>();

/** The reader's tracking status and the lessons they've finished in a course. */
export function useProgress(section: string): { status: ProgressStatus; done: Set<string> } {
  const current = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  return { status: current.status, done: current.done.get(section) ?? NONE };
}
