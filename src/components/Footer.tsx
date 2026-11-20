import Link from "@/components/Link";
import LogoMark, { Wordmark } from "@/components/LogoMark";

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest shadow-[0_-1px_8px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-xl flex flex-col md:flex-row items-center justify-between gap-space-md">
        {/* Phones: the name on one line and the tagline centred under it; side by side from sm up. */}
        <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:gap-space-sm sm:text-left">
          <span className="flex items-center gap-space-sm whitespace-nowrap">
            <LogoMark className="h-6 w-auto" />
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              <Wordmark />
            </span>
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant sm:ml-space-xs">
            <span className="hidden sm:inline">— </span>Algorithmic Mental Models &amp; Hardware Diagnostics
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
            <Link href="/refund-policy" className="text-on-surface-variant hover:text-primary">
              Refunds
            </Link>
            <Link href="/contact" className="text-on-surface-variant hover:text-primary">
              Contact
            </Link>
          </nav>
          <p className="text-center font-code-sm text-code-sm text-on-surface-variant md:text-right">
            © {new Date().getFullYear()} Intuition Rewire. Systematic Engineering Mastery.
          </p>
        </div>
      </div>
    </footer>
  );
}
