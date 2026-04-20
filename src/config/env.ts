import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || '8000',
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || 'internal-secret',
};