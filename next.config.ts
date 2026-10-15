import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Doubly and circular linked lists are taught inside the Linked List course.
      { source: "/dsa/doubly-linked-list", destination: "/dsa/singly-linked-list", permanent: true },
      { source: "/dsa/doubly-linked-list/:path*", destination: "/dsa/singly-linked-list", permanent: true },
    ];
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
