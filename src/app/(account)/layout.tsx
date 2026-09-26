import type { ReactNode } from "react";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-start justify-center bg-surface-container-low/60 px-gutter-mobile py-space-2xl sm:items-center">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
