import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest shadow-[0_-1px_8px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-xl flex flex-col md:flex-row items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-primary-container text-on-primary text-xs">
            ⌁
          </span>
          <span className="font-label-md text-label-md text-on-surface font-semibold">
            Intuition Rewire
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant ml-space-xs">
            — Algorithmic Mental Models &amp; Hardware Diagnostics
          </span>
        </div>
        <div className="flex flex-col items-center gap-space-xs md:items-end">
          <nav className="flex items-center gap-space-md font-label-md text-label-md">
            <Link href="/privacy" className="text-on-surface-variant hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="text-on-surface-variant hover:text-primary">
              Terms
            </Link>
          </nav>
          <p className="font-code-sm text-code-sm text-on-surface-variant">
            © {new Date().getFullYear()} Intuition Rewire. Systematic Engineering Mastery.
          </p>
        </div>
      </div>
    </footer>
  );
}
