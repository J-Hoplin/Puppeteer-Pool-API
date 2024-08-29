# Puppeteer Pool Manager

**This readme is temporary document**

## Routes

- `POST /`
  - Body: `{ url: url }`
- `GET /health`
  - Get ping
- `GET /health/metrics`
  - GET application metrics and puppeteer pool metrics

## Puppeteer Pool Manager apis (`src/pool/manager.ts`)

**This directory will be deployed as single npm package**

### `bootPoolManager`

Boot pool manager. **You need to invoke this function at least once to use another APIs**

### `rebootPoolManager`

Reboot pool manager. **This api is not recommended to use. Using this API in runtime may occur unintended process break**

### `controlSession`

Return single session from pool. You need to pass callback function as parameter to use in session. This return result of callback function return value

```typescript
// Session Callback type
import { Page } from 'puppeteer';

type sessionCallback = (page: Page) => Promise<any>;
```

### `getPoolMetrics`

Return pool metrics. This includes pool id, pool CPU Usage, Memory Usage

## Usage Example

Example of combining pool manager with Express Framework

```typescript
import {
  bootPoolManager,
  controlSession,
  getPoolMetrics,
} from '(Manager Import path)';

async function bootstrap() {
  /**
   * Initialize Express Server
   */

  // Initialize pool
  await bootPoolManager();

  // Control Session example
  server.post('/', async (req, res) => {
    const url = req.body.url;

    // Get single session from pool
    const controlResponse = await controlSession(async (session) => {
      /**
       * Control session here
       */
      return; //(Some values)
    });
    return res.status(200).json({ result: controlResponse });
  });

  server.get('/', async (req, res) => {
    const puppeteerPoolMetrics = await getPoolMetrics();
    return res.status(200).json(puppeteerPoolMetrics);
  });

  /**
   * Some other routers and start server
   */
}
```
