/**
 * Server configuration constants
 */
export const SERVER = {
  /** Default port number */
  DEFAULT_PORT: 3001,
  /** Default environment */
  DEFAULT_ENV: 'development',
  /** Default CORS origins */
  DEFAULT_ORIGINS: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'] as string[],
  /** Request size limit */
  REQUEST_LIMIT: '10kb',
  /** Rate limit window in minutes */
  RATE_LIMIT_WINDOW: 15,
  /** Maximum requests per window */
  RATE_LIMIT_MAX: 100
} as const;

/**
 * Security configuration constants
 */
export const SECURITY = {
  /** Cookie settings */
  COOKIE: {
    /** CSRF cookie key */
    CSRF_KEY: '_csrf',
    /** Session cookie key */
    SESSION_KEY: 'session',
    /** SameSite attribute */
    SAME_SITE: 'Lax',
    /** Secure flag */
    SECURE: process.env.NODE_ENV === 'production'
  },
  /** CSP directives */
  CSP: {
    /** Script sources */
    SCRIPT_SRC: ["'self'", "'unsafe-inline'"] as string[],
    /** Style sources */
    STYLE_SRC: ["'self'", "'unsafe-inline'"] as string[],
    /** Image sources */
    IMG_SRC: ["'self'", 'data:', 'https:'] as string[],
    /** Connect sources */
    CONNECT_SRC: ["'self'", 'http://localhost:*'] as string[]
  }
} as const;

/**
 * Cache configuration constants
 */
export const CACHE = {
  /** SRI algorithm */
  SRI_ALGORITHM: 'sha384',
  /** Asset paths */
  ASSETS: {
    /** CSS file path */
    CSS: 'banner/consent-banner.css',
    /** JavaScript file path */
    JS: 'banner/consent-banner.js'
  }
} as const;

/**
 * Error messages
 */
export const ERRORS = {
  /** Validation errors */
  VALIDATION: {
    INVALID_STORAGE: 'Invalid storage type. Must be "localStorage" or "cookie"',
    INVALID_DURATION: 'Cookie duration must be between 1 and 365 days',
    INVALID_NAME: 'Consent name must be between 1 and 50 characters',
    INVALID_TEXT: 'Banner text must be between 1 and 500 characters',
    INVALID_CATEGORIES: 'Categories configuration is invalid'
  },
  /** Server errors */
  SERVER: {
    ASSET_LOAD: 'Failed to load banner assets',
    GENERATE: 'Failed to generate installation code',
    INTERNAL: 'Internal server error occurred'
  },
  /** Security errors */
  SECURITY: {
    CSRF: 'CSRF token validation failed',
    RATE_LIMIT: 'Too many requests'
  }
} as const;

/**
 * Default configuration values
 */
export const DEFAULTS = {
  /** Cookie duration in days */
  COOKIE_DURATION: 365,
  /** Default consent name */
  CONSENT_NAME: '_cb_consent',
  /** Default banner text */
  TEXT: 'This website uses cookies to ensure you get the best experience.',
  /** Default detailed text */
  DETAILED_TEXT: 'Click "Accept" to enable cookies or "Preferences" to choose which cookies to enable.',
  /** Default button texts */
  BUTTONS: {
    ACCEPT: 'Accept All',
    REJECT: 'Reject All',
    PREFERENCES: 'Preferences'
  }
} as const;

/**
 * Regular expressions for validation
 */
export const REGEX = {
  /** Valid cookie name pattern */
  COOKIE_NAME: /^[a-zA-Z0-9_-]+$/,
  /** Valid URL pattern */
  URL: /^https?:\/\/.+/,
  /** Valid hex color pattern */
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
} as const;
