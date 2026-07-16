import dotenv from 'dotenv';

dotenv.config();

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),

  DATABASE_URL: required('DATABASE_URL'),

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',

  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'https://skill-bridge-admin-web.vercel.app,http://localhost:5173,http://localhost:3000,http://localhost:5174,http://localhost:5175,http://localhost:8081,http://localhost:19006,exp://192.168.0.0:8081',

  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX ?? 200),

  // Unverified/abandoned-account cleanup (hours). Accounts older than this that
  // never started onboarding are removed by the daily background job.
  UNVERIFIED_ACCOUNT_TTL_HOURS: Number(process.env.UNVERIFIED_ACCOUNT_TTL_HOURS ?? 24),

  CLOUDINARY_CLOUD_NAME: required('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: required('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: required('CLOUDINARY_API_SECRET'),

  isProduction: process.env.NODE_ENV === 'production',
};
