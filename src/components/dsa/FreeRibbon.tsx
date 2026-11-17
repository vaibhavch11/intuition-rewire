"use client";

import { useUser } from "@/lib/auth/useUser";

/**
 * A green "PREVIEW" band across a card's top-right corner, for courses anyone
 * can read without an account. The card needs `relative` and `overflow-hidden`.
 * Only signed-out visitors need telling, so it goes once a reader is signed in.
 * While the session is still loading it shows, as most visitors are signed out.
 */
export default function FreeRibbon({ size = "md" }: { size?: "sm" | "md" }) {
  const small = size === "sm";
  if (useUser()) return null;
  return (
    <>
      <span
        aria-hidden
        className={`pointer-events-none absolute right-0 top-0 z-10 overflow-hidden ${
          small ? "h-[78px] w-[78px]" : "h-[100px] w-[100px]"
        }`}
      >
        <span
          className={`absolute block rotate-45 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-center font-label-md font-bold uppercase text-white shadow-[0_3px_8px_-2px_rgba(5,150,105,0.55)] ring-1 ring-inset ring-white/25 dark:from-emerald-500 dark:via-emerald-400 dark:to-emerald-500 dark:text-emerald-950 ${
            small
              ? "right-[-34px] top-[18px] w-[130px] py-[2px] text-[9px] tracking-[0.14em]"
              : "right-[-40px] top-[24px] w-[160px] py-[3px] text-[10.5px] tracking-[0.16em]"
          }`}
        >
          Preview
        </span>
      </span>
      <span className="sr-only">Free preview, no account needed.</span>
    </>
  );
}
