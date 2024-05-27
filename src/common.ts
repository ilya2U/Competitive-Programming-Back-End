import { config } from 'dotenv';
import * as appConfig from '@/private/config.json';

config();

export const { JWT_SECRET } = appConfig;

export const DATABASE_HOST = process.env.DATABASE_HOST;

// export const DATABASE_NAME = process.env.DATABASE_NAME;
// export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
// export const DATABASE_USER = process.env.DATABASE_USER;
