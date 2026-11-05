import { Clapperboard } from "lucide-react";
import Link from "@/components/Link";
import SectionHeader from "@/components/home/SectionHeader";
import TourVideo from "@/components/TourVideo";

/** The 23-second product tour: real dry-run, lessons and race footage. Its watch page is /tour. */
export default function ProductTourSection() {
  return (
    <section
      id="product-tour"
      className="max-w-7xl mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-2xl"
    >
      <SectionHeader
        eyebrow="23-second tour"
        icon={Clapperboard}
        title={
          <>
            Watch it <span className="text-primary-container">run</span>
          </>
        }
        lead="Walk through a lesson, take the water challenge and watch a BST insert step by step — all recorded straight from the platform."
      />

      <div className="mx-auto mt-space-xl max-w-5xl overflow-hidden rounded-3xl bg-surface-container-lowest shadow-[0_1px_2px_rgba(19,27,46,0.04),0_28px_56px_-32px_rgba(19,27,46,0.35)] ring-1 ring-outline-variant/70">
        <TourVideo deferred />
      </div>
      <p className="mt-space-md text-center font-body-sm text-body-sm text-on-surface-variant">
        <Link href="/tour" className="text-primary underline-offset-4 hover:underline">
          Open the tour on its own page
        </Link>
      </p>
    </section>
  );
}
