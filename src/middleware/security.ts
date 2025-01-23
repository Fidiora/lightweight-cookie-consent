import { Request, Response, NextFunction } from 'express';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { SECURITY, SERVER, ERRORS } from '../constants';
import { generateRateLimitKey } from '../utils';
import { OriginValidator } from '../types/security';
import { OriginValidatorImpl } from '../security/originValidator';
import helmet from 'helmet';
import cors from 'cors';

/**
 * Configure security headers using helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: SECURITY.CSP.SCRIPT_SRC,
      styleSrc: SECURITY.CSP.STYLE_SRC,
      imgSrc: SECURITY.CSP.IMG_SRC,
      connectSrc: SECURITY.CSP.CONNECT_SRC,
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" }
});

/**
 * Initialize origin validator
 */
const originValidator: OriginValidator = OriginValidatorImpl.fromEnvironment(SERVER.DEFAULT_ORIGINS);

/**
 * Handle CORS origin validation
 */
const handleOrigin = (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void => {
  const result = originValidator.isValid(requestOrigin);
  
  if (result.isValid) {
    callback(null, true);
  } else {
    callback(new Error(result.message || ERRORS.SECURITY.CSRF));
  }
};

/**
 * CORS configuration options
 */
const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    handleOrigin(requestOrigin, callback);
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-csrf-token'],
  maxAge: 600
};

/**
 * Configure CORS middleware
 */
export const corsMiddleware = cors(corsOptions);

/**
 * Configure rate limiting
 */
export const rateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: SERVER.RATE_LIMIT_WINDOW * 60 * 1000,
  max: SERVER.RATE_LIMIT_MAX,
  message: { error: ERRORS.SECURITY.RATE_LIMIT },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const ip = req.ip || 'unknown';
    const path = req.path || 'unknown';
    return generateRateLimitKey(ip, path);
  }
});

/**
 * Clean request headers middleware
 */
export function cleanHeaders(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Remove potentially dangerous headers
  const dangerousHeaders = [
    'x-powered-by',
    'server',
    'x-aspnet-version',
    'x-aspnetmvc-version'
  ];

  dangerousHeaders.forEach(header => {
    delete req.headers[header.toLowerCase()];
  });

  next();
}

/**
 * Request size limiter middleware
 */
export function requestSizeLimiter(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err.name === 'PayloadTooLargeError') {
    res.status(413).json({
      error: 'Request Entity Too Large',
      details: 'The request body exceeds the maximum allowed size',
      code: 'PAYLOAD_TOO_LARGE'
    });
    return;
  }
  next(err);
}

/**
 * XSS Protection middleware
 */
function xssProtection(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // Set XSS protection headers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}

/**
 * Cache control middleware
 */
function cacheControl(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Prevent caching of sensitive routes
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
}

/**
 * Security middleware composition
 */
export const security = [
  securityHeaders,
  corsMiddleware,
  rateLimiter,
  cleanHeaders,
  xssProtection,
  cacheControl
];