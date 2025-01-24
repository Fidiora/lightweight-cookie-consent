//# sourcemap=index.js.map
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import sriToolbox from 'sri-toolbox';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Configure CORS
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://127.0.0.1:5176'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 600 // Cache preflight requests for 10 minutes
};

// Apply base middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key'));

// Serve static banner assets with correct MIME types
app.use('/banner', express.static(join(__dirname, 'assets', 'banner'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Security: Comprehensive CSP and security headers
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Required for banner injection
      styleSrc: ["'self'", "'unsafe-inline'"], // Required for banner styles
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Required for cross-origin resource loading
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" }
}));

// Performance: Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' }
});

app.use('/api', limiter);

// CSRF protection
app.use(csrf({
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
}));

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  const token = req.csrfToken();
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.json({ token });
});

// Error handler for CSRF
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'Please refresh the page and try again',
      debug: process.env.NODE_ENV === 'development' ? {
        token: req.headers['x-csrf-token'],
        cookies: req.cookies
      } : undefined
    });
  }
  next(err);
});

// Validation middleware
const validateBannerConfig = [
  body('storageType').isIn(['localStorage', 'cookie']),
  body('cookieDuration').optional().isInt({ min: 1, max: 365 }),
  body('consentName').trim().isLength({ min: 1, max: 50 }),
  body('text').trim().isLength({ min: 1, max: 500 }),
  body('categories').isObject()
];

// Cache for banner assets
const assetCache = new Map();
let assetVersion = Date.now();

// Load banner assets
async function loadBannerAssets() {
  try {
    const cssPath = join(__dirname, 'assets', 'banner', 'consent-banner.css');
    const jsPath = join(__dirname, 'assets', 'banner', 'consent-banner.js');

    const [cssContent, jsContent] = await Promise.all([
      fs.readFile(cssPath, 'utf8'),
      fs.readFile(jsPath, 'utf8')
    ]);

    const cssSRI = sriToolbox.generate({ algorithms: ['sha384'] }, cssContent);
    const jsSRI = sriToolbox.generate({ algorithms: ['sha384'] }, jsContent);

    assetCache.set('css', { content: cssContent, sri: cssSRI });
    assetCache.set('js', { content: jsContent, sri: jsSRI });
    assetVersion = Date.now();

    console.log('Banner assets loaded and cached successfully');
  } catch (error) {
    console.error('Error loading banner assets:', {
      message: error.message,
      stack: error.stack,
      path: error.path || 'unknown'
    });
    throw error;
  }
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Generate banner code endpoint
app.post('/api/generate', validateBannerConfig, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const config = req.body;
    const baseUrl = process.env.API_URL || `http://localhost:${port}`;

    const installationCode = `
<!-- Consent Banner -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = "${baseUrl}/banner/consent-banner.js?v=${assetVersion}";
    script.integrity = "${assetCache.get('js').sri}";
    script.crossOrigin = "anonymous";
    
    var style = document.createElement('link');
    style.rel = "stylesheet";
    style.href = "${baseUrl}/banner/consent-banner.css?v=${assetVersion}";
    style.integrity = "${assetCache.get('css').sri}";
    style.crossOrigin = "anonymous";
    
    script.onload = function() {
      window.CookieConsentBanner.init(${JSON.stringify(config)});
    };
    
    document.head.appendChild(style);
    document.body.appendChild(script);
  })();
</script>`.trim();

    res.json({ 
      success: true,
      installationCode,
      version: assetVersion
    });
  } catch (error) {
    console.error('Error generating banner code:', error);
    res.status(500).json({ 
      error: 'Failed to generate installation code',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'CSRF token validation failed',
      details: 'Please refresh the page and try again'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start server
async function startServer() {
  try {
    console.log('Initializing consent banner server...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Loading banner assets...');
    await loadBannerAssets();
    
    app.listen(port, () => {
      console.log('✓ Banner assets loaded successfully');
      console.log(`✓ Server running on port ${port}`);
      console.log(`✓ Health check available at http://localhost:${port}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', {
      message: error.message,
      stack: error.stack,
      details: error.details || 'No additional details'
    });
    process.exit(1);
  }
}

startServer();
