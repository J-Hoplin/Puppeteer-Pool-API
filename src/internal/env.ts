import { config } from 'dotenv';

config();

// Port number of express application. Default port is 3000
export const APP_PORT = process.env.PORT || 5700;
