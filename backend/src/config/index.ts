import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Centralized, strictly-typed application configuration.
 * All env values are validated/parsed here so the rest of the app
 * can consume strongly-typed values without touching process.env.
 */
export interface AppConfig {
  port: number;
  nodeEnv: string;
  isProduction: boolean;
  mongoUri: string;
  jwt: {
    secret: string;
    expiresIn: string;
    cookieName: string;
  };
  cookie: {
    secure: boolean;
    sameSite: 'none' | 'lax' | 'strict';
    domain: string | undefined;
  };
  cors: {
    clientOrigin: string;
  };
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

function parseSameSite(value: string | undefined): 'none' | 'lax' | 'strict' {
  const v = (value ?? 'lax').toLowerCase();
  if (v === 'none' || v === 'strict' || v === 'lax') return v;
  return 'lax';
}

const env = process.env;

export const config: AppConfig = {
  port: Number(env.PORT ?? 5000),
  nodeEnv: env.NODE_ENV ?? 'development',
  isProduction: env.NODE_ENV === 'production',
  mongoUri: env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/quizarena',
  jwt: {
    secret: env.JWT_SECRET ?? 'dev-insecure-secret',
    expiresIn: env.JWT_EXPIRES_IN ?? '1d',
    cookieName: env.JWT_COOKIE_NAME ?? 'qa_token',
  },
  cookie: {
    secure: parseBoolean(env.COOKIE_SECURE, false),
    sameSite: parseSameSite(env.COOKIE_SAMESITE),
    domain: env.COOKIE_DOMAIN ? env.COOKIE_DOMAIN : undefined,
  },
  cors: {
    clientOrigin: env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  },
};
