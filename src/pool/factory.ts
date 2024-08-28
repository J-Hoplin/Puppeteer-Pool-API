import puppeteer, { PuppeteerLaunchOptions } from 'puppeteer';
import genericPool, { Pool } from 'generic-pool';
import { config } from '../internal/config';
import { logger } from '../internal/logger';
import { SinglePool } from './pool';
import dayjs from 'dayjs';
import { sessionCallback } from './type';
import { PoolNotInitializedException, SessionCallbackException } from './error';
import { enablePageCaching, ignoreResourceLoading } from './options';

// Pool Instance
let pools: Pool<any> = null;

// Browser Pool ID
let browserPoolId = 1;

async function sessionPoolFactory(
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

async function poolFactory() {
  pools = genericPool.createPool(
    {
      create: async () => {
        const id = browserPoolId++;
        logger.info(`Creating browser pool --- Pool ID: ${id}`);
        const pool = await sessionPoolFactory(
          id,
          {},
          config.session_pool.ignoreResourceLoad,
          config.session_pool.enablePageCache,
        );
        return { pool, id };
      },
      destroy: async ({ pool, id }) => {
        logger.info(`Destroying browser pool --- Pool ID: ${id}`);
        await pool.close();
      },
    },
    {
      max: config.browser_pool.max,
      min: config.browser_pool.min,
    },
  );
}

/**
 * Intialize Pool
 *
 * - Set pool instance
 * - Add signal shutdown
 */
export async function initializePool() {
  await poolFactory();
  const targetSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
  targetSignals.forEach((signal) => {
    process.on(signal, () => {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
      logger.info(
        `${now} --- Signal received(${signal}) - Terminating puppeteer pool`,
      );
      (async () => {
        await pools.drain();
        await pools.clear();
      })();
    });
  });
}

export async function controlSession(cb: sessionCallback) {
  // If pool not initialized
  if (!pools) {
    throw new PoolNotInitializedException();
  }
  // resource type: {pool,id}
  /**
   * Resource type
   * {
   *  pool: SinglePool,
   *  id: number
   * }
   *
   */
  const resource = await pools.acquire();
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
  await pools.release(resource);
  if (isSuccess) {
    return callbackReturn;
  } else {
    throw exception;
  }
}
