import Image from "next/image";
import mark from "@/assets/logo-mark.png";

/**
 * The "IR" mark. Decorative: it always sits next to the site's name. Sized by
 * height through className (e.g. "h-8 w-auto"); the file is 3x the largest use.
 */
export default function LogoMark({ className }: { className?: string }) {
  return <Image src={mark} alt="" unoptimized className={className} />;
}

/** "Intuition Rewire" in the logo's two colours. */
export function Wordmark() {
  return (
    <>
      Intuition <span className="text-primary-container dark:text-primary">Rewire</span>
    </>
  );
}
