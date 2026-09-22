# IntuitionRewire

Learn DSA by watching it run. A data-structures-and-algorithms learning platform that rewires intuition for algorithms and memory physics through step-by-step visual dry-runs.

**Live:** https://intuition-rewire.intuition-rewire.workers.dev

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19 + TypeScript
- [Tailwind CSS](https://tailwindcss.com) 4
- [Excalidraw](https://excalidraw.com) for in-lesson diagrams
- [react-three-fiber](https://r3f.docs.pmnd.rs) / three.js for visualizations
- Hosted on [Cloudflare Workers](https://developers.cloudflare.com/workers/) via the [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare)
- [Cloudflare R2](https://developers.cloudflare.com/r2/) for lesson content and uploaded images/drawings in production

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Content authoring

Lessons live under `/dsa/<section>/<topic>` and are authored through the `/admin` editor (`/admin/login`), gated by a single `ADMIN_PASSWORD` set in `.env.local`.

Content has two storage backends, tried in this order on read:

1. **Local disk** (`content/lessons/<section>/<topic>.json`, `public/uploads/`, `public/drawings/`) — how `npm run dev` reads and writes. This is the reviewable, git-committed baseline; author locally and commit the result as usual.
2. **Cloudflare R2** (bucket `intuition-rewire-storage`) — the only backend that exists once deployed, since the Worker has no filesystem. Saves made through `/admin` on the live site write here and take effect immediately, no redeploy needed — `/dsa/[section]/[topic]` renders dynamically rather than being statically prerendered, specifically so a live edit shows up right away.

**After authoring new lessons locally and committing them**, run `npm run seed-content` to upload any lesson JSON that isn't already in R2. It never overwrites a key that already exists there, so it can't clobber something edited live on the deployed site — it only fills in what's new from git.

## Deploy (Cloudflare)

```bash
npm run preview   # build + run locally against the Worker runtime
npm run deploy    # build + deploy to Cloudflare
```

`ADMIN_PASSWORD` must be set as a Worker secret for production, separately from `.env.local`:

```bash
wrangler secret put ADMIN_PASSWORD
```

`.dev.vars` (gitignored) holds the same value for local `npm run preview` runs against the Worker runtime. The R2 bucket binding (`CONTENT_BUCKET`) is declared in `wrangler.jsonc`; regenerate `cloudflare-env.d.ts` with `npm run cf-typegen` after changing bindings.
