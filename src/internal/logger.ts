import pino from 'pino';
import { RequestHandler } from 'express';

const processId = process.pid;

// Logger Info
const transport = pino.transport({
  targets: [
    {
      level: 'trace',
      target: 'pino-pretty',
      options: { colorize: true },
    },
  ],
});

export const logger = pino(transport);

export const loggerMiddleware: RequestHandler = (req, res, next) => {
  const { method, originalUrl, ip } = req;
  const timeStart = process.hrtime();

  const prevRes = res.send;
  res.send = (body) => {
    const { statusCode } = res;

    // Set logger
    let level: pino.Level;
    if (statusCode >= 200 && statusCode < 300) {
      level = 'info';
    } else if (statusCode >= 400 && statusCode < 500) {
      level = 'warn';
    } else {
      level = 'error';
    }
    const performanceTime = process.hrtime(timeStart);
    const millisecond = (performanceTime[1] * 1e-6).toFixed(3);
    const logMessage = `[${method}] - ${originalUrl} ${ip} - Duration: ${millisecond}ms Status: ${statusCode}`;
    logger[level](logMessage);
    return prevRes.bind(res)(body);
  };
  next();
};
