import { Origin, OriginPattern, OriginValidator, OriginValidationResult } from '../types/security';

/**
 * Validates origins against allowed patterns
 */
export class OriginValidatorImpl implements OriginValidator {
  constructor(private readonly allowedOrigins: readonly string[]) {}

  /**
   * Check if a value is a non-empty string
   */
  private isValidString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
  }

  /**
   * Check if a string matches a pattern with wildcard support
   */
  public match(origin: string, pattern: string): boolean {
    if (!this.isValidString(origin) || !this.isValidString(pattern)) {
      return false;
    }

    if (pattern.includes('*')) {
      // Escape special regex characters except *
      const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
      const regexPattern = new RegExp('^' + escapedPattern.replace(/\*/g, '.*') + '$');
      return regexPattern.test(origin);
    }

    return origin === pattern;
  }

  /**
   * Validate an origin against allowed patterns
   */
  public isValid(origin: Origin): OriginValidationResult {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return { isValid: true };
    }

    // Validate origin string
    if (!this.isValidString(origin)) {
      return {
        isValid: false,
        message: 'Invalid origin format'
      };
    }

    // Check against allowed patterns
    const matches = this.allowedOrigins.some(pattern => this.match(origin, pattern));

    return {
      isValid: matches,
      message: matches ? undefined : `Origin ${origin} not allowed`
    };
  }

  /**
   * Create an origin validator from environment or defaults
   */
  static fromEnvironment(defaultOrigins: readonly string[]): OriginValidatorImpl {
    const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean);
    const allowedOrigins = (envOrigins ?? defaultOrigins).filter(Boolean);
    return new OriginValidatorImpl(allowedOrigins);
  }
}