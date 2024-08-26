import { config } from 'dotenv';

config();

export const ENV = {
  PORT: process.env.PORT || 8080,
};
