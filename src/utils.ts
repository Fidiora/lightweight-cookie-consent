import { RateLimitKeyOptions } from './types/security';

/**
 * Generates a rate limit key from request parameters
 * @param ip The IP address of the request
 * @param path The request path
 * @returns A string key for rate limiting
 */
export function generateRateLimitKey(ip: string | undefined, path: string | undefined): string {
  const safeIp = ip || 'unknown';
  const safePath = path || 'unknown';
  return `${safeIp}-${safePath}`;
}

/**
 * Verifies that all required parameters are present
 * @param params The parameters to verify
 * @returns A boolean indicating if all parameters are present
 */
export function verifyRequiredParams(params: Record<string, unknown>): boolean {
  return Object.values(params).every(value => value !== undefined && value !== null);
}

/**
 * Safely get a value with a fallback
 * @param value The value to check
 * @param fallback The fallback value
 * @returns The value or fallback
 */
export function getValueOrFallback<T>(value: T | undefined, fallback: T): T {
  return value === undefined ? fallback : value;
}