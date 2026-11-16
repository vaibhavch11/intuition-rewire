/**
 * A green "FREE" band across a card's top-right corner, for courses anyone can
 * read without an account. The card needs `relative` and `overflow-hidden`.
 */
export default function FreeRibbon({ size = "md" }: { size?: "sm" | "md" }) {
  const small = size === "sm";
  return (
    <>
      <span
        aria-hidden
        className={`pointer-events-none absolute right-0 top-0 z-10 overflow-hidden ${
          small ? "h-[64px] w-[64px]" : "h-[84px] w-[84px]"
        }`}
      >
        <span
          className={`absolute block rotate-45 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-center font-label-md font-bold uppercase text-white shadow-[0_3px_8px_-2px_rgba(5,150,105,0.55)] ring-1 ring-inset ring-white/25 dark:from-emerald-500 dark:via-emerald-400 dark:to-emerald-500 dark:text-emerald-950 ${
            small
              ? "right-[-26px] top-[12px] w-[96px] py-[2px] text-[9.5px] tracking-[0.18em]"
              : "right-[-32px] top-[17px] w-[124px] py-[3px] text-[11px] tracking-[0.2em]"
          }`}
        >
          Free
        </span>
      </span>
      <span className="sr-only">Free course, no account needed.</span>
    </>
  );
}
