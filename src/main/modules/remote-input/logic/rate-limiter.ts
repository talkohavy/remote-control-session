/**
 * Token bucket over a one-second window.
 *
 * A remote peer can push events far faster than a human can act - whether through a bug,
 * a wedged auto-repeat or deliberate flooding. Dropping the excess keeps the host
 * responsive; queueing it would just build an ever-growing backlog of stale input.
 */
export class RateLimiter {
  private windowStartedAt = 0;
  private countInWindow = 0;

  constructor(private readonly maxPerSecond: number) {}

  tryConsume(now = Date.now()): boolean {
    if (now - this.windowStartedAt >= 1000) {
      this.windowStartedAt = now;
      this.countInWindow = 0;
    }

    if (this.countInWindow >= this.maxPerSecond) return false;

    this.countInWindow += 1;

    return true;
  }
}
