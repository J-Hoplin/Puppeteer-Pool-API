import * as fs from 'fs';
import { logger } from './logger';

// Default Config
export const config = {
  application: {
    port: 3000,
    memory: 1024,
  },
  browser_pool: {
    min: 2,
    max: 5,
    width: 1080,
    height: 1024,
  },
  session_pool: {
    min: 1,
    max: 5,
    width: 1080,
    height: 1024,
    ignoreResourceLoad: false,
    enablePageCache: false,
  },
};

export const load = (configPath: string) => {
  try {
    const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    // Appplication Config
    if (loadedConfig?.application) {
      config.application.port =
        loadedConfig?.application?.port ?? config.application.port;
      config.application.memory =
        loadedConfig?.application?.memory ?? config.application.memory;
    }
    // Browser Pool Config
    if (loadedConfig?.browser_pool) {
      config.browser_pool.min =
        loadedConfig?.browser_pool?.min ?? config.browser_pool.min;
      config.browser_pool.max =
        loadedConfig?.browser_pool?.max ?? config.browser_pool.max;
    }
    // Session Pool Config
    if (loadedConfig?.session_pool) {
      config.session_pool.min =
        loadedConfig?.session_pool?.min ?? config.session_pool.min;
      config.session_pool.max =
        loadedConfig?.session_pool?.max ?? config.session_pool.max;
      config.session_pool.width =
        loadedConfig?.session_pool?.width ?? config.session_pool.width;
      config.session_pool.height =
        loadedConfig?.session_pool?.height ?? config.session_pool.height;
      config.session_pool.ignoreResourceLoad =
        loadedConfig?.session_pool?.ignoreResourceLoad ??
        config.session_pool.ignoreResourceLoad;
      config.session_pool.enablePageCache =
        loadedConfig?.session_pool?.enablePageCache ??
        config.session_pool.enablePageCache;
    }
    logger.info('Config loaded successfully');
  } catch (err) {
    // If error while loading config, use default config
    logger.warn('Fail to load config. Use default config');
  }
};
