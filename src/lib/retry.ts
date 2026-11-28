// One retry for transient RPC failures (a public RPC throttling a burst). Bounded: one extra attempt after a short,
// jittered pause; a second failure is returned to the caller, who reports it as unavailable (never as a value).
export async function retryOnce<T>(fn: () => Promise<T>, pauseMs = 250): Promise<T> {
  try {
    return await fn();
  } catch {
    await new Promise((r) => setTimeout(r, pauseMs + Math.floor(Math.random() * pauseMs)));
    return fn();
  }
}

/** Run tasks with at most `limit` in flight, keeping input order. */
export async function mapLimit<A, B>(items: A[], limit: number, fn: (a: A) => Promise<B>): Promise<B[]> {
  const out: B[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
