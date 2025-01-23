import { Request, Response, NextFunction } from 'express';
import { ApiError, validateBannerConfig, isValidHexColor } from '../utils';
import { ERRORS } from '../constants';
import { ThemeConfig, BannerConfig } from '../types';

/**
 * Validates the banner configuration request body
 */
export function validateBannerRequest(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    validateBannerConfig(req.body);

    // Additional theme validation if present
    if (req.body.theme) {
      validateThemeConfig(req.body.theme);
    }

    // Additional vendor validation if present
    if (req.body.vendors) {
      validateVendorConfig(req.body.vendors);
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validates theme configuration
 */
function validateThemeConfig(theme: unknown): asserts theme is ThemeConfig {
  if (!theme || typeof theme !== 'object') {
    throw new ApiError('Invalid theme configuration', 400, 'INVALID_THEME');
  }

  const { colors, position, mode } = theme as ThemeConfig;

  if (colors) {
    if (typeof colors !== 'object' || !colors.primary || !colors.background || !colors.text) {
      throw new ApiError('Invalid color configuration', 400, 'INVALID_COLORS');
    }

    if (!isValidHexColor(colors.primary) || 
        !isValidHexColor(colors.background) || 
        !isValidHexColor(colors.text)) {
      throw new ApiError('Invalid color format', 400, 'INVALID_COLOR_FORMAT');
    }
  }

  if (position && !isValidPosition(position)) {
    throw new ApiError('Invalid position value', 400, 'INVALID_POSITION');
  }

  if (mode && !isValidMode(mode)) {
    throw new ApiError('Invalid theme mode', 400, 'INVALID_THEME_MODE');
  }
}

/**
 * Validates vendor configuration
 */
function validateVendorConfig(vendors: unknown): void {
  if (!vendors || typeof vendors !== 'object') {
    throw new ApiError('Invalid vendor configuration', 400, 'INVALID_VENDORS');
  }

  const vendorEntries = Object.entries(vendors as Record<string, unknown>);
  
  for (const [vendorId, config] of vendorEntries) {
    if (!config || typeof config !== 'object') {
      throw new ApiError(`Invalid vendor config for ${vendorId}`, 400, 'INVALID_VENDOR_CONFIG');
    }

    const { name, description, privacyPolicy } = config as Record<string, unknown>;

    if (!name || typeof name !== 'string') {
      throw new ApiError(`Missing or invalid vendor name for ${vendorId}`, 400, 'INVALID_VENDOR_NAME');
    }

    if (!description || typeof description !== 'string') {
      throw new ApiError(`Missing or invalid vendor description for ${vendorId}`, 400, 'INVALID_VENDOR_DESCRIPTION');
    }

    if (!privacyPolicy || typeof privacyPolicy !== 'string' || !isValidUrl(privacyPolicy)) {
      throw new ApiError(`Invalid privacy policy URL for ${vendorId}`, 400, 'INVALID_PRIVACY_URL');
    }
  }
}

/**
 * Type guard for banner position values
 */
function isValidPosition(position: string): position is NonNullable<ThemeConfig['position']> {
  return ['top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(position);
}

/**
 * Type guard for theme mode values
 */
function isValidMode(mode: string): mode is NonNullable<ThemeConfig['mode']> {
  return ['light', 'dark', 'custom'].includes(mode);
}

/**
 * Validates URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes and validates request parameters
 */
export function sanitizeRequestParams(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Sanitize query parameters
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = value.trim();
      }
    }

    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Recursively sanitizes object values
 */
function sanitizeObject(obj: Record<string, any>): void {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      obj[key] = value.trim();
    } else if (value && typeof value === 'object') {
      sanitizeObject(value);
    }
  }
}