import type { Metadata } from "next";
import type { ReactNode } from "react";

// Sign-in pages have nothing to rank for; lessons link here with ?next=, which
// would otherwise be crawled as many copies of the same page.
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-start justify-center bg-surface-container-low/60 px-gutter-mobile py-space-2xl sm:items-center">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
