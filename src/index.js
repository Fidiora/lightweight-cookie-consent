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

// Security: Generate strong nonce for CSP
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(32).toString('base64');
  next();
});

// Security: Comprehensive CSP and security headers
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for banner functionality
        (req, res) => `'nonce-${res.locals.nonce}'`
      ],
      styleSrc: ["'self'", "'unsafe-inline'"], // Required for banner styling
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:5173"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    }
  },
  // Security: Additional headers
  crossOriginEmbedderPolicy: { policy: "require-corp" },
  crossOriginResourcePolicy: { policy: "same-site" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Performance: Compression for all responses
app.use(compression({
  level: 6, // Balanced compression level
  threshold: 1024 // Only compress responses > 1KB
}));

// Security: Rate limiting with IP-based throttling
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  skip: (req) => req.url.startsWith('/banner/'), // Don't rate limit banner assets
});

// Security: CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'null', // Allow local file testing in development
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'CSRF-Token'],
  exposedHeaders: ['CSRF-Token'],
  maxAge: 600 // Cache preflight requests for 10 minutes
};

// Apply middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' })); // Limit request body size
app.use(cookieParser(process.env.COOKIE_SECRET));

// Security: CSRF protection
const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    signed: true,
    maxAge: 3600 // 1 hour
  }
});

// Apply rate limiting to API routes
app.use('/api', limiter);

// Cache for banner assets with versioning
const assetCache = new Map();
let assetVersion = Date.now();

// Performance: Load and cache banner assets
async function loadBannerAssets() {
  try {
    const cssPath = join(__dirname, 'assets', 'banner', 'consent-banner.css');
    const jsPath = join(__dirname, 'assets', 'banner', 'consent-banner.js');

    const [cssContent, jsContent] = await Promise.all([
      fs.readFile(cssPath, 'utf8'),
      fs.readFile(jsPath, 'utf8')
    ]);

    // Generate SRI hashes
    const cssSRI = sriToolbox.generate({ algorithms: ['sha384'] }, cssContent);
    const jsSRI = sriToolbox.generate({ algorithms: ['sha384'] }, jsContent);

    // Update cache
    assetCache.set('css', { content: cssContent, sri: cssSRI });
    assetCache.set('js', { content: jsContent, sri: jsSRI });
    assetVersion = Date.now();

    console.log('Banner assets loaded and cached successfully');
  } catch (error) {
    console.error('Error loading banner assets:', error);
    throw error;
  }
}

// Performance: Serve static files with aggressive caching
const staticOptions = {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.setHeader('Timing-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
};

app.use('/banner', express.static(join(__dirname, 'assets', 'banner'), staticOptions));

// Validation: Banner configuration schema
const validateBannerConfig = [
  body('storageType')
    .isIn(['localStorage', 'cookie'])
    .withMessage('Storage type must be either localStorage or cookie'),
  body('cookieDuration')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Cookie duration must be between 1 and 365 days'),
  body('consentName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Consent name must be alphanumeric'),
  body('text')
    .trim()
    .isLength({ min: 1, max: 500 })
    .escape()
    .withMessage('Banner text is required and must be less than 500 characters'),
  body('categories')
    .isObject()
    .withMessage('Categories must be an object')
];

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    version: process.env.npm_package_version,
    timestamp: new Date().toISOString()
  });
});

// Security: CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Generate banner code
app.post('/api/generate', csrfProtection, validateBannerConfig, async (req, res) => {
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
    const version = assetVersion;

    // Generate installation code with versioning and SRI
    const installationCode = `
<!-- Consent Banner v${version} -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = "${baseUrl}/banner/consent-banner.js?v=${version}";
    script.integrity = "${assetCache.get('js').sri}";
    script.crossOrigin = "anonymous";
    
    var style = document.createElement('link');
    style.rel = "stylesheet";
    style.href = "${baseUrl}/banner/consent-banner.css?v=${version}";
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
      version
    });
  } catch (error) {
    console.error('Error generating banner code:', error);
    res.status(500).json({ 
      error: 'Failed to generate installation code',
      details: error.message
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      details: 'Please refresh the page and try again'
    });
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Initialize server
async function startServer() {
  try {
    await loadBannerAssets();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
