/**
 * Strictly-typed access to Vite environment variables.
 * Throws at module load if a required variable is missing so misconfig
 * fails fast instead of producing undefined at runtime.
 */

interface ViteEnv {
  VITE_API_BASE_URL: string;
}

function readEnv(): ViteEnv {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof baseUrl !== 'string' || baseUrl.length === 0) {
    throw new Error(
      'Missing required env variable VITE_API_BASE_URL. Check frontend/.env',
    );
  }
  return { VITE_API_BASE_URL: baseUrl };
}

export const env: ViteEnv = readEnv();
