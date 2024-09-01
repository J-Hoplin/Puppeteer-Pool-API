# Puppeteer Pool Manager

**Example Repository of [`@hoplin/puppeteer-pool`](https://github.com/J-Hoplin/Puppeteer-Pool)**

## Routes

- `POST /`
  - Body: `{ url: url }`
- `GET /health`
  - Get ping
- `GET /health/metrics`
  - GET application metrics and puppeteer pool metrics

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
  await bootPoolManager({Puppeteer Launch Options},'Puppeteer Pool Config Path');

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
