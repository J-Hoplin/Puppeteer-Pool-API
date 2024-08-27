import { Browser } from 'puppeteer';
import { Pool } from 'generic-pool';
import { logger } from '../internal/logger';

export class SinglePool<T = any> {
  constructor(
    private poolId: number,
    private browser: Browser,
    private pool: Pool<T>,
  ) {}

  public async acquireSession() {
    logger.info(`Acquire session from --- Pool ID: ${this.poolId}`);
    return await this.pool.acquire();
  }

  public async releaseSession(session: T) {
    return await this.pool.release(session);
  }

  async close() {
    await this.pool.drain();
    await this.pool.clear();
    await this.browser.close();
  }
}
