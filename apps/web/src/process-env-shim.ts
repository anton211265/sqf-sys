// Vite has no Node `process` global in the browser. This polyfills it from
// import.meta.env (which Vite always populates correctly, in both dev and
// build) so source carried over from the old CRA setup that reads
// process.env.REACT_APP_X keeps working without a per-key vite.config.ts define.
if (typeof window !== 'undefined' && !(window as unknown as { process?: unknown }).process) {
  (window as unknown as { process: { env: Record<string, string> } }).process = {
    env: { ...import.meta.env } as Record<string, string>,
  };
}
