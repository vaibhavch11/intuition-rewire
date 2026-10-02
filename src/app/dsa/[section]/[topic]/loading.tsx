/**
 * Shown the moment a lesson is picked in the index, while the next lesson
 * loads. The index itself lives in the layout, so it stays put.
 */
export default function LessonLoading() {
  return (
    <div
      role="status"
      aria-label="Loading lesson"
      className="mx-auto max-w-6xl px-gutter-mobile py-space-2xl motion-safe:animate-fade-in lg:px-space-2xl"
    >
      <div className="animate-pulse motion-reduce:animate-none">
        <div className="h-10 w-2/3 rounded-lg bg-surface-container-high" />
        <div className="mt-space-md flex gap-space-sm">
          <div className="h-7 w-14 rounded-md bg-surface-container" />
          <div className="h-7 w-14 rounded-md bg-surface-container" />
          <div className="h-7 w-24 rounded-md bg-surface-container" />
        </div>
        <div className="mt-space-base mb-space-2xl h-px bg-outline-variant/50" />
        <div className="space-y-space-sm">
          <div className="h-4 w-full rounded bg-surface-container" />
          <div className="h-4 w-[96%] rounded bg-surface-container" />
          <div className="h-4 w-[88%] rounded bg-surface-container" />
        </div>
        <div className="mt-space-xl h-7 w-1/3 rounded-lg bg-surface-container-high" />
        <div className="mt-space-md space-y-space-sm">
          <div className="h-4 w-full rounded bg-surface-container" />
          <div className="h-4 w-[92%] rounded bg-surface-container" />
        </div>
        <div className="mt-space-xl h-56 rounded-xl bg-surface-container" />
      </div>
    </div>
  );
}
