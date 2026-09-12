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
        <p className="font-code-sm text-code-sm text-on-surface-variant">
          © {new Date().getFullYear()} Intuition Rewire. Systematic Engineering Mastery.
        </p>
      </div>
    </footer>
  );
}
