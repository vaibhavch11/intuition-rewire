import { Clapperboard } from "lucide-react";
import Link from "@/components/Link";
import SectionHeader from "@/components/home/SectionHeader";
import TourPlayer from "@/components/home/TourPlayer";

/** The product tour: a silent loop of real lesson, challenge and dry-run footage. Its watch page is /tour. */
export default function ProductTourSection() {
  return (
    <section
      id="product-tour"
      className="overflow-x-clip max-w-7xl mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-2xl"
    >
      <SectionHeader
        eyebrow="Product tour"
        icon={Clapperboard}
        title={
          <>
            Watch it <span className="text-primary-container">run</span>
          </>
        }
        lead="Walk through a lesson and the learning path, then watch a BST insert step by step, all recorded straight from the platform."
      />

      <TourPlayer />
      <p className="mt-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">
        <Link href="/tour" className="text-primary underline-offset-4 hover:underline">
          Open the tour on its own page
        </Link>
      </p>
    </section>
  );
}
