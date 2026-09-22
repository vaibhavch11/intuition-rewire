# IntuitionRewire

Learn DSA by watching it run. A data-structures-and-algorithms learning platform that rewires intuition for algorithms and memory physics through step-by-step visual dry-runs.

**Live:** https://intuition-rewire.intuition-rewire.workers.dev

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19 + TypeScript
- [Tailwind CSS](https://tailwindcss.com) 4
- [Excalidraw](https://excalidraw.com) for in-lesson diagrams
- [react-three-fiber](https://r3f.docs.pmnd.rs) / three.js for visualizations
- Hosted on [Cloudflare Workers](https://developers.cloudflare.com/workers/) via the [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Content authoring

Lessons live under `/dsa/<section>/<topic>` and are authored through the `/admin` editor (`/admin/login`), gated by a single `ADMIN_PASSWORD` set in `.env.local`.

The editor writes lesson bodies to `content/lessons/<section>/<topic>.json`, uploaded images to `public/uploads/`, and Excalidraw drawings to `public/drawings/`. This is filesystem-based and **only works with `npm run dev`** — the deployed Worker has no writable filesystem, so saves are a no-op there. Author locally, then commit the resulting JSON/image files; the deployed site reads them at build time.

## Deploy (Cloudflare)

```bash
npm run preview   # build + run locally against the Worker runtime
npm run deploy    # build + deploy to Cloudflare
```

`ADMIN_PASSWORD` must be set as a Worker secret for production, separately from `.env.local`:

```bash
wrangler secret put ADMIN_PASSWORD
```

`.dev.vars` (gitignored) holds the same value for local `npm run preview` runs against the Worker runtime.
