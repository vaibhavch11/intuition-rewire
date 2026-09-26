import type { CurriculumChange } from "@/lib/dsa/curriculum";

/** Posts one change to the course structure; throws with the server's message if it's refused. */
export async function sendCurriculumChange(
  change: CurriculumChange
): Promise<{ slug?: string }> {
  const response = await fetch("/api/admin/curriculum", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(change),
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error ?? "That change couldn't be saved. Try again.");
  }
  return body ?? {};
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Try again.";
}
