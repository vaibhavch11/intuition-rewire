import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Cloudflare Workers has no writable filesystem, so R2 is the durable store
 * once this is running as the deployed Worker. During `next build`'s static
 * generation and during `next dev`, the binding may be a local emulation or
 * entirely unavailable — callers treat a null bucket as "fall back to disk".
 */
export async function getContentBucket(): Promise<R2Bucket | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.CONTENT_BUCKET ?? null;
  } catch {
    return null;
  }
}
