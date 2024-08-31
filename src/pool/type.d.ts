import { Page } from 'puppeteer';

/**
 * Type of pool metadata single entry's value
 */
export type MetadataMap = {
  pid: number;
  sessionPoolCount: number;
  thresholdCheckerId?: number;
};

/**
 * Type of session callback
 */
export type sessionCallback = (page: Page) => Promise<any>;

/**
 * Type of session pool metrics
 */
export type PoolMetricsType = {
  Id: string;
  CPU: number;
  Memory: number;
  SessionPoolCount: number;
};
