import { Page } from 'puppeteer';

export type sessionCallback = (page: Page) => Promise<any>;
