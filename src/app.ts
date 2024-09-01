import { bootPoolManager, controlSession } from '@hoplin/puppeteer-pool';
import { loggerMiddleware } from './internal/logger';
import { startServer } from './internal/process';
import express, { Application } from 'express';
import router from './routes';

async function bootstrap() {
  // Initialize pool
  await bootPoolManager();

  const server: Application = express();

  // Base Middleware
  server.use(
    express.json(),
    express.urlencoded({ extended: true }),
    loggerMiddleware,
  );

  server.post('/', async (req, res) => {
    const url = req.body.url;
    const htmlContent = await controlSession(async (session) => {
      await session.goto(url);

      return await session.content();
    });
    return res.status(200).json({ result: htmlContent });
  });

  server.use(router);

  startServer(server);
}

bootstrap();
