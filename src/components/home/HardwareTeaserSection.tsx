import { Gauge, Route } from "lucide-react";
import SectionHeader from "@/components/home/SectionHeader";
import CacheLocalityCard from "@/components/home/CacheLocalityCard";

const LATENCIES = [
  { value: "~0.5 ns", label: "L1 cache hit", detail: "Reading the next array slot" },
  { value: "~80 ns", label: "DRAM stall", detail: "Chasing a pointer to a cold node" },
];

export default function HardwareTeaserSection() {
  return (
    <section className="max-w-7xl mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-2xl">
      <div className="grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeader
            align="left"
            eyebrow="Deep architecture"
            title="Beyond Big-O: Why Cache Locality Trumps Asymptotics"
            lead={
              <>
                Most DSA platforms teach that an insertion in a linked list is{" "}
                <code className="rounded bg-surface-container px-1 font-code-sm text-code-sm">O(1)</code> while an
                array insertion is{" "}
                <code className="rounded bg-surface-container px-1 font-code-sm text-code-sm">O(N)</code>. Yet in
                real production hardware, cache prefetching and CPU cache lines make array shifts up to 50x faster
                for millions of elements.
              </>
            }
          />

          <dl className="mt-space-lg grid grid-cols-2 gap-space-md">
            {LATENCIES.map((item) => (
              <div
                key={item.label}
                className="flex flex-col-reverse rounded-2xl bg-surface-container-low p-space-md ring-1 ring-inset ring-outline-variant/60"
              >
                <dt className="font-body-sm text-body-sm text-on-surface-variant">
                  <span className="block font-semibold text-on-surface">{item.label}</span>
                  {item.detail}
                </dt>
                <dd className="mb-space-xs text-[26px] font-semibold leading-8 tracking-tight text-on-surface">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          <ul className="mt-space-lg space-y-space-sm">
            <li className="flex items-center gap-space-sm font-label-md text-label-md text-on-surface">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-fixed/60 text-primary">
                <Gauge size={17} />
              </span>
              64-byte L1 Cache line burst transfers
            </li>
            <li className="flex items-center gap-space-sm font-label-md text-label-md text-on-surface">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-container/50 text-on-secondary-container">
                <Route size={17} />
              </span>
              Pointer dereference latency &amp; cold RAM stalls
            </li>
          </ul>
        </div>

        <div className="lg:col-span-7">
          <CacheLocalityCard />
        </div>
      </div>
    </section>
  );
}
