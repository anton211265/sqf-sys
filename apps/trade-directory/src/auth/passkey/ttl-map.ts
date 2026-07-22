/**
 * Minimal in-memory store with per-entry expiry, for short-lived auth state
 * (WebAuthn challenges, QR login sessions). Single-instance dev deployment
 * only — production multi-instance would move this to Redis, which is a
 * Terraform-phase concern (see CLAUDE.md "Production Deployment Roadmap").
 */
export class TtlMap<T> {
  private readonly map = new Map<string, { value: T; expiresAt: number }>();
  private readonly sweeper: NodeJS.Timeout;

  constructor(private readonly defaultTtlMs: number) {
    // Lazy eviction covers correctness; the sweeper just caps memory growth.
    this.sweeper = setInterval(() => this.sweep(), 60_000);
    this.sweeper.unref();
  }

  set(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /** Read without consuming. */
  peek(key: string): T | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.map.delete(key);
      return null;
    }
    return entry.value;
  }

  /** Single-use read — the entry is removed whether or not it expired. */
  take(key: string): T | null {
    const value = this.peek(key);
    this.map.delete(key);
    return value;
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.map) {
      if (entry.expiresAt < now) this.map.delete(key);
    }
  }
}
