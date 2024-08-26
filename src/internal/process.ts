import { Application } from 'express';
import { logger } from './logger';
import { ENV } from './config';
import dayjs from 'dayjs';

export function startServer(
  server: Application,
  enableGracefulShutdown = true,
) {
  const serverProcess = server.listen(ENV.PORT, () => {
    logger.info(`Server listening on port ${ENV.PORT}`);
  });

  // Add process graceful shutdown
  if (enableGracefulShutdown) {
    const targetSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    targetSignals.forEach((signal) => {
      process.on(signal, () => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        serverProcess.close(() => {
          logger.info(`${now} --- Signal received(${signal}) - Closing Server`);
        });
      });
    });
  }
  return true;
}
