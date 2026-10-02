import { Clapperboard } from "lucide-react";
import SectionHeader from "@/components/home/SectionHeader";

/** The 22-second product tour: real dry-run, lessons and race footage. */
export default function ProductTourSection() {
  return (
    <section
      id="product-tour"
      className="max-w-7xl mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-2xl"
    >
      <SectionHeader
        eyebrow="22-second tour"
        icon={Clapperboard}
        title={
          <>
            Watch it <span className="text-primary-container">run</span>
          </>
        }
        lead="Press Play on Kadane’s algorithm, flip through the Arrays course and watch Big-O win a race, all recorded straight from the platform."
      />

      <div className="mx-auto mt-space-xl max-w-5xl overflow-hidden rounded-3xl bg-surface-container-lowest shadow-[0_1px_2px_rgba(19,27,46,0.04),0_28px_56px_-32px_rgba(19,27,46,0.35)] ring-1 ring-outline-variant/70">
        <video
          className="block aspect-video w-full bg-surface-container-low"
          controls
          playsInline
          preload="metadata"
          poster="/videos/intuition-rewire-tour.jpg"
          aria-label="IntuitionRewire product tour: a step-by-step dry run of Kadane's algorithm, the Arrays course and the live algorithm race"
        >
          <source src="/videos/intuition-rewire-tour.mp4" type="video/mp4" />
          <a href="/videos/intuition-rewire-tour.mp4" className="text-primary underline">
            Download the tour video
          </a>
        </video>
      </div>
    </section>
  );
}
