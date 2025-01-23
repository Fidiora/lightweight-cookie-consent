# Lightweight Cookie Consent Banner

A lightweight, robust, and customizable cookie consent solution that helps websites comply with privacy regulations like GDPR and CCPA.

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Node.js CI](https://github.com/your-username/lightweight-cookie-consent/workflows/Node.js%20CI/badge.svg)](https://github.com/your-username/lightweight-cookie-consent/actions)

## 🚀 Features

- 🔒 **GDPR and CCPA Compliant**
  - Granular consent categories
  - Audit-ready logging
  - Privacy-first approach
  - Documented data handling

- 🎨 **Highly Customizable**
  - Multiple themes (Light/Dark)
  - Custom colors and branding
  - Flexible positioning
  - Responsive design

- ⚡ **Lightweight & Fast**
  - < 5KB gzipped
  - No external dependencies
  - Async loading
  - High performance with caching

- 🛠️ **Developer Friendly**
  - RESTful API
  - TypeScript support
  - Comprehensive documentation
  - Easy integration

## 🔧 Quick Start

1. Install via npm:
```bash
npm install lightweight-cookie-consent
```

2. Create a `.env` file:
```env
PORT=3001
NODE_ENV=development
COOKIE_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

3. Start the server:
```bash
npm run start
```

## 📖 API Documentation

### Endpoints

#### GET /api/health
Health check endpoint to verify server status.

**Response:**
```json
{
  "status": "healthy"
}
```

#### GET /api/csrf-token
Get CSRF token for subsequent requests.

**Response:**
```json
{
  "csrfToken": "token-here"
}
```

#### POST /api/generate
Generate banner installation code.

**Request Body:**
```json
{
  "storageType": "localStorage",
  "cookieDuration": 365,
  "consentName": "myCookieConsent",
  "text": "We use cookies to improve your experience",
  "categories": {
    "necessary": {
      "name": "Essential",
      "required": true
    },
    "analytics": {
      "name": "Analytics",
      "required": false
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "installationCode": "<!-- Generated installation code -->",
  "version": "timestamp"
}
```

## 🔒 Security Features

- **CSP (Content Security Policy)**: Strict CSP headers
- **CSRF Protection**: Token-based CSRF prevention
- **Rate Limiting**: IP-based request throttling
- **Security Headers**: Using Helmet.js
- **CORS**: Configurable origin restrictions
- **Cookie Security**: HTTP-only, secure flags
- **SRI**: Subresource Integrity for assets

## ⚡ Performance

- Gzip compression
- Static asset caching with ETags
- In-memory caching for banner assets
- Cache-Control headers
- Asset versioning
- Async operations

### Scaling Recommendations

1. **Load Balancing**
   - Use multiple instances behind a load balancer
   - Enable sticky sessions if needed

2. **Caching**
   - Implement Redis for distributed caching
   - Use CDN for static assets

3. **Rate Limiting**
   - Adjust rate limits based on traffic
   - Use Redis for distributed rate limiting

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Code Quality Standards

- Write unit tests for new features
- Maintain >90% test coverage
- Follow ESLint rules
- Add JSDoc comments
- Update TypeScript types
- Follow semantic versioning

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔍 Technical Details

### System Requirements
- Node.js ≥ 16
- NPM ≥ 7

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3001 |
| NODE_ENV | Environment | development |
| COOKIE_SECRET | Cookie encryption key | Required |
| ALLOWED_ORIGINS | CORS origins | http://localhost:3000 |

### Error Handling
All errors follow this format:
```json
{
  "error": "Error type",
  "details": "Detailed message",
  "code": "ERROR_CODE"
}
