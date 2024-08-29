import {
  PoolManagerNotInitializedException,
  SessionCallbackException,
} from './error';
import puppeteer, { Browser, PuppeteerLaunchOptions } from 'puppeteer';
import { enablePageCaching, ignoreResourceLoading } from './options';
import genericPool, { Pool } from 'generic-pool';
import { config } from '../internal/config';
import { logger } from '../internal/logger';
import { sessionCallback } from './type';
import pidusage from 'pidusage';
import dayjs from 'dayjs';

let managerInstance: PuppeteerPoolManager = null;

/**
 * Create new puppeteer pool manager
 *
 * Invoke boot method
 */
export async function bootPoolManager(
  puppeteerOptions: PuppeteerLaunchOptions = {},
) {
  /**
   * Boot should be boot only once
   */
  if (managerInstance) {
    logger.warn('Pool manager already booted. Ignore invoke signal');
    return;
  }
  logger.info('Boot pool manager');
  managerInstance = new PuppeteerPoolManager();
  await managerInstance.boot(puppeteerOptions);
}

/**
 * Reboot pool manager
 *
 * Warning: Not recommended
 */
export async function rebootPoolManager() {
  logger.info('Reboot pool manager');
  if (managerInstance) {
    logger.info('Terminate current pool manager');
    await managerInstance.terminatePool();
    // Set instace to null
    managerInstance = null;
  }
  await bootPoolManager();
}

/**
 *
 * Issue session and run user's callback function
 *
 * throw exception if pool manager is not initialized
 */
export async function controlSession(cb: sessionCallback) {
  if (managerInstance === null) {
    throw new PoolManagerNotInitializedException();
  }
  return await managerInstance.issueSession(cb);
}

/**
 * Get entire metrics of pools which manager is managing
 *
 * throw exception if pool manager is not initialized
 */
export async function getPoolMetrics() {
  if (managerInstance === null) {
    throw new PoolManagerNotInitializedException();
  }
  return await managerInstance.getPoolMetrics();
}

class PuppeteerPoolManager {
  // Pool Instance
  private pools: Pool<any> = null;

  // Browser Pool ID - Increment
  private browserPoolId = 1;

  // Map: pid: browser process id
  private puppeteerPIDMap: Map<number, number> = new Map();

  /**
   * Manager Booter - Browser Pool Factory
   *
   * Enroll signal handler for graceful shutdown
   */
  async boot(options: PuppeteerLaunchOptions) {
    this.pools = genericPool.createPool(
      {
        create: async () => {
          const id = this.browserPoolId++;
          logger.info(`Creating browser pool --- Pool ID: ${id}`);
          const pool = await this.sessionPoolFactory(
            id,
            {},
            config.session_pool.ignoreResourceLoad,
            config.session_pool.enablePageCache,
          );
          return { pool, id };
        },
        destroy: async ({ pool, id }) => {
          this.puppeteerPIDMap.delete(id);
          logger.info(`Destroying browser pool --- Pool ID: ${id}`);
          await pool.close();
        },
      },
      {
        max: config.browser_pool.max,
        min: config.browser_pool.min,
      },
    );
    const targetSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    targetSignals.forEach((signal) => {
      process.on(signal, () => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        logger.info(
          `${now} --- Signal received(${signal}) - Terminating puppeteer pool`,
        );
        for (const [poolId, pid] of this.puppeteerPIDMap) {
          const poolAlias = `POOL_${poolId}(PID: ${pid})`;
          try {
            process.kill(pid, 'SIGTERM');
            logger.info(`${poolAlias} successfully terminated`);
          } catch (err) {
            logger.error(`${poolAlias} termination failed`);
          }
        }
        process.exit(0);
      });
    });
  }

  /**
   * Session Pool Facotory
   */
  async sessionPoolFactory(
    poolId: number,
    puppeteerConfig: PuppeteerLaunchOptions = {},
    ignoreResourceLoad = false,
    enablePageCache = false,
  ) {
    let sessionCounter = 1;
    const browser = await puppeteer.launch({
      ...puppeteerConfig,
      headless: true,
    });
    const browserProcessId = browser.process().pid;

    // Enroll PID of puppeteer process when browser is created
    this.puppeteerPIDMap.set(poolId, browserProcessId);
    const sessionPool = genericPool.createPool(
      {
        create: async () => {
          const page = await browser.newPage();
          await page.setViewport({
            width: config.session_pool.width,
            height: config.session_pool.height,
          });

          // Speedy Text Scrape option
          if (ignoreResourceLoad) {
            await ignoreResourceLoading(page);
          }
          if (enablePageCache) {
            await enablePageCaching(page);
          }

          const sessionId = sessionCounter++;
          logger.info(
            `Creating session pool --- Session ID: ${poolId}_${sessionId}`,
          );
          return { page, sessionId };
        },
        destroy: async ({ page, sessionId }) => {
          logger.info(
            `Destroying session pool --- Session ID: ${poolId}_${sessionId}`,
          );
          await page.close();
        },
      },
      {
        max: config.session_pool.max,
        min: config.session_pool.min,
      },
    );
    return new SinglePool(poolId, browser, sessionPool);
  }

  async issueSession(cb: sessionCallback) {
    /**
     * Resource type
     * {
     *  pool: SinglePool,
     *  id: number
     * }
     *
     */
    const resource = await this.pools.acquire();
    const singlePool = resource.pool;
    let isSuccess = true;
    let exception = null;
    let callbackReturn = null;
    try {
      /**
       * sessionPoolResource type
       * {
       *   page: Page,
       *   sessionId: number
       * }
       *
       */
      const sessionPoolResource = await singlePool.acquireSession();
      callbackReturn = await cb(sessionPoolResource.page);
      await singlePool.releaseSession(sessionPoolResource);
    } catch (err) {
      isSuccess = false;
      exception = new SessionCallbackException(
        (err as Error)?.message ?? 'Unknown Exception',
      );
    }
    await this.pools.release(resource);
    if (isSuccess) {
      return callbackReturn;
    } else {
      throw exception;
    }
  }

  async getPoolMetrics() {
    /**
     * CPU Usage unit: %
     * Memory Usage unit: GB
     */
    const response = {};
    for (const [poolId, pid] of this.puppeteerPIDMap) {
      const stats = await pidusage(pid);
      const CPUUsage = stats.cpu.toFixed(2);
      const MemoryUsage = stats.memory / 1024 / 1024 / 1024;
      response[`POOL_${poolId}`] = {
        CPU: `${CPUUsage}%`,
        Memory: `${MemoryUsage.toFixed(2)}GB`,
      };
    }
    return response;
  }

  async terminatePool() {
    await this.pools.drain();
    await this.pools.clear();
    logger.info('Successfully terminated pool');
  }
}

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
