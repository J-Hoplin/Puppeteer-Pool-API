import { Application } from 'express';
import { logger } from './logger';
import { APP_PORT } from './env';
import dayjs from 'dayjs';

export function startServer(
  server: Application,
  enableGracefulShutdown = true,
) {
  const port = APP_PORT;
  const serverProcess = server.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });
  // Add process graceful shutdown
  if (enableGracefulShutdown) {
    const targetSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    targetSignals.forEach((signal) => {
      process.on(signal, async () => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        serverProcess.close(() => {
          logger.info(`${now} --- Signal received(${signal}) - Closing Server`);
        });
      });
    });
  }
  return true;
}
