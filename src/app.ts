import express, { Application } from 'express';
import { loggerMiddleware } from './internal/logger';
import { startServer } from './internal/process';

const server: Application = express();

// Base Middleware
server.use(
  express.json(),
  express.urlencoded({ extended: true }),
  loggerMiddleware,
);

server.get('/', (req, res) => {
  res.send('Hello World!');
});

startServer(server);
