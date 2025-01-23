import { Request } from 'express';

/**
 * Origin validation types
 */
export type OriginPattern = string;
export type RequestOrigin = string | undefined;

/**
 * Server configuration types
 */
export type AllowedOrigin = string;

/**
 * Banner storage type options
 */
export type StorageType = 'localStorage' | 'cookie';

/**
 * Cookie category configuration
 */
export interface CategoryConfig {
  /** Display name of the category */
  name: string;
  /** Detailed description of what this category is for */
  description?: string | undefined;
  /** Whether this category is required and cannot be disabled */
  required?: boolean | undefined;
  /** List of vendors associated with this category */
  vendors?: string[] | undefined;
}

/**
 * Vendor information configuration
 */
export interface VendorConfig {
  /** Display name of the vendor */
  name: string;
  /** Description of vendor's purpose */
  description: string;
  /** Link to vendor's privacy policy */
  privacyPolicy: string;
}

/**
 * Theme configuration for the banner
 */
export interface ThemeConfig {
  /** Custom color scheme */
  colors?: {
    primary: string;
    background: string;
    text: string;
  } | undefined;
  /** Banner position on the page */
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | undefined;
  /** Theme mode */
  mode?: 'light' | 'dark' | 'custom' | undefined;
}

/**
 * Main banner configuration
 */
export interface BannerConfig {
  /** Storage mechanism for consent */
  storageType: StorageType;
  /** Duration in days for cookie storage */
  cookieDuration?: number | undefined;
  /** Unique identifier for consent storage */
  consentName: string;
  /** Whether to show banner automatically */
  autoShow?: boolean | undefined;
  /** Force show banner even if consent exists */
  forceShow?: boolean | undefined;
  /** Link to privacy policy */
  privacyPolicyUrl?: string | undefined;
  /** Main banner text */
  text: string;
  /** Detailed explanation text */
  detailedText?: string | undefined;
  /** Accept button text */
  acceptButtonText?: string | undefined;
  /** Reject button text */
  rejectButtonText?: string | undefined;
  /** Preferences button text */
  preferencesButtonText?: string | undefined;
  /** Cookie categories configuration */
  categories: Record<string, CategoryConfig>;
  /** Vendor configurations */
  vendors?: Record<string, VendorConfig> | undefined;
  /** Theme configuration */
  theme?: ThemeConfig | undefined;
}

/**
 * API error response
 */
export interface ErrorResponse {
  /** Error type or category */
  error: string;
  /** Detailed error message */
  details: string;
  /** Optional error code */
  code: string | undefined;
}

/**
 * Installation code generation response
 */
export interface GenerateResponse {
  /** Whether the operation was successful */
  success: boolean;
  /** Generated installation code */
  installationCode: string;
  /** Asset version timestamp */
  version: number;
}

/**
 * Asset cache entry
 */
export interface AssetCacheEntry {
  /** Asset content */
  content: string;
  /** SRI hash for the asset */
  sri: string;
}

/**
 * CSRF token response
 */
export interface CsrfResponse {
  /** CSRF token for form submission */
  csrfToken: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  /** Server status */
  status: 'healthy' | 'unhealthy';
  /** Optional additional details */
  details: Record<string, unknown> | undefined;
}

/**
 * Express request with banner configuration
 */
export interface BannerRequest extends Request {
  body: BannerConfig;
}

/**
 * Environment types
 */
export type Environment = 'development' | 'production' | 'test';