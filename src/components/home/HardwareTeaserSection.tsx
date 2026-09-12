import { Gauge, Route } from "lucide-react";

export default function HardwareTeaserSection() {
  return (
    <section className="max-w-7xl mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-2xl w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
        <div className="lg:col-span-6 flex flex-col">
          <span className="font-label-tag text-label-tag text-primary uppercase">
            Deep Architecture
          </span>
          <h2 className="font-headline-xl text-headline-xl text-on-surface mt-space-xs">
            Beyond Big-O: Why Cache Locality Trumps Asymptotics
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm mb-space-md">
            Most DSA platforms teach that an insertion in a linked list is{" "}
            <code className="font-code-sm text-code-sm">O(1)</code> while an array
            insertion is <code className="font-code-sm text-code-sm">O(N)</code>. Yet
            in real production hardware, cache prefetching and CPU cache lines make
            array shifts up to 50x faster for millions of elements.
          </p>
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low shadow-sm">
              <Gauge className="text-primary" size={20} />
              <span className="font-label-md text-label-md text-on-surface">
                64-byte L1 Cache line burst transfers
              </span>
            </div>
            <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low shadow-sm">
              <Route className="text-secondary" size={20} />
              <span className="font-label-md text-label-md text-on-surface">
                Pointer dereference latency &amp; cold RAM stalls
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-2xl bg-inverse-surface text-inverse-on-surface p-space-lg shadow-md font-code-sm text-code-sm">
            <div className="flex items-center justify-between pb-space-sm border-b border-surface-variant/20 mb-space-md text-on-surface-variant">
              <span>cpu_cache_line_profile.rs</span>
              <span className="text-secondary-fixed">Hardware Benchmark</span>
            </div>
            <pre className="overflow-x-auto text-inverse-on-surface font-code-sm leading-relaxed whitespace-pre-wrap">
              <span className="text-tertiary-fixed">
                {"// Contiguous Array traversal: 1 cache miss per 16 ints\n"}
              </span>
              <span className="text-primary-fixed">for</span>
              {" x "}
              <span className="text-primary-fixed">in</span>
              {" contiguous_ram_chunk.iter() {\n    accum += *x; "}
              <span className="text-secondary-fixed">{"// ~0.5ns L1 hit"}</span>
              {"\n}\n\n"}
              <span className="text-tertiary-fixed">
                {"// Node-based Linked List: Pointer chasing through heap\n"}
              </span>
              <span className="text-primary-fixed">while let</span>
              {" Some(node) = current {\n    accum += node.value; "}
              <span className="text-error-container">{"// ~80ns DRAM Cold Cache Stall!"}</span>
              {"\n    current = node.next;\n}"}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
