/**
 * Origin validation types
 */
export type Origin = string | undefined;
export type OriginPattern = string;
export type OriginCallback = (err: Error | null, allow?: boolean) => void;

/**
 * Origin validation result
 */
export interface OriginValidationResult {
  /** Whether the origin is valid */
  isValid: boolean;
  /** Optional error message if validation fails */
  message?: string | undefined;
}

/**
 * Origin validator interface
 */
export interface OriginValidator {
  /** Validate an origin */
  isValid(origin: Origin): OriginValidationResult;
  /** Match an origin against a pattern */
  match(origin: Origin, pattern: OriginPattern): boolean;
}

/**
 * CORS Error type
 */
export interface CorsError {
  /** Error message */
  message: string;
  /** Error code */
  code?: string | undefined;
}

/**
 * Origin validation options
 */
export interface OriginValidationOptions {
  /** Whether to allow undefined origins */
  allowUndefined?: boolean;
  /** Whether to allow null origins */
  allowNull?: boolean;
  /** Custom validation message */
  message?: string;
}

/**
 * Rate limit key generator options
 */
export interface RateLimitKeyOptions {
  /** IP address */
  ip: string;
  /** Request path */
  path: string;
}