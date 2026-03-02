# Security Recommendations for Production

## Overview

This document outlines security best practices and recommendations for running GOFAPS in production. While the application includes many security features out of the box, additional measures should be considered based on your specific use case.

## ✅ Implemented Security Measures

### 1. Security Headers (Helmet.js)
- **Content Security Policy (CSP)** - Restricts resource loading
- **HTTP Strict Transport Security (HSTS)** - Forces HTTPS
- **X-Frame-Options** - Prevents clickjacking
- **X-Content-Type-Options** - Prevents MIME sniffing
- **Referrer-Policy** - Controls referrer information

### 2. Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- Automatic 429 responses with retry-after headers

### 3. CORS Configuration
- Configurable allowed origins via `ALLOWED_ORIGINS` environment variable
- Credentials support for authenticated requests
- Preflight request handling

### 4. Input Validation
- Request size limits (10MB for JSON and URL-encoded)
- Basic input sanitization middleware
- Express validator recommended for form inputs

### 5. Database Security
- Connection pooling with limits
- Parameterized queries via Drizzle ORM
- Connection timeout and retry logic

### 6. Session Security
- SESSION_SECRET minimum 32 characters
- Secure cookie flags
- PostgreSQL session storage

### 7. Logging & Monitoring
- Structured logging with correlation IDs
- No sensitive data in logs
- Daily log rotation

---

## ⚠️ Additional Recommendations

### 1. XSS Prevention

**Current State:** Basic sanitization middleware + CSP headers

**Recommendations:**
1. **Install DOMPurify** for client-side HTML sanitization:
   ```bash
   npm install dompurify
   npm install --save-dev @types/dompurify
   ```

2. **Install validator.js** for server-side input validation:
   ```bash
   npm install validator
   npm install --save-dev @types/validator
   ```

3. **Use Content Security Policy Nonces** for inline scripts:
   ```typescript
   // Generate nonce per request
   app.use((req, res, next) => {
     res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
     next();
   });
   ```

4. **Output Encoding** - Always encode based on context:
   - HTML: `&lt;`, `&gt;`, `&amp;`, `&quot;`, `&#x27;`
   - JavaScript: Use JSON.stringify
   - URLs: Use encodeURIComponent
   - CSS: Avoid user input in CSS

### 2. CSRF Protection

**Current State:** Not implemented (relies on SameSite cookies)

**Recommendation:** Add csurf middleware for state-changing operations:
```bash
npm install csurf
```

```typescript
import csrf from 'csurf';
app.use(csrf({ cookie: true }));
```

### 3. SQL Injection Prevention

**Current State:** Using Drizzle ORM with parameterized queries ✅

**Best Practices:**
- Never concatenate user input into queries
- Always use ORM query builders
- Validate and sanitize all inputs
- Use prepared statements

### 4. Authentication Enhancements

**Recommendations:**
1. **Account Lockout** - Lock accounts after N failed attempts:
   ```typescript
   // Track failed attempts in database
   // Lock for 15 minutes after 5 failures
   ```

2. **Multi-Factor Authentication (MFA)**:
   - Add TOTP support (authenticator apps)
   - SMS backup codes
   - Recovery codes

3. **Password Requirements**:
   - Minimum 12 characters
   - Mix of upper, lower, numbers, special chars
   - Check against common password lists
   - Implement zxcvbn for password strength

4. **Session Management**:
   - Automatic session timeout (30 minutes idle)
   - Concurrent session limits (max 3 per user)
   - Force logout on password change

### 5. API Security

**Recommendations:**
1. **API Keys** for external integrations:
   ```typescript
   // Rotate keys every 90 days
   // Use separate keys per environment
   // Store in Azure Key Vault or AWS Secrets Manager
   ```

2. **Webhook Verification**:
   ```typescript
   // Verify signatures from payment providers
   // Use timing-safe comparison
   import crypto from 'crypto';
   const isValid = crypto.timingSafeEqual(
     Buffer.from(signature),
     Buffer.from(expected)
   );
   ```

3. **Request Validation**:
   ```typescript
   import { body, validationResult } from 'express-validator';
   
   app.post('/api/users', [
     body('email').isEmail().normalizeEmail(),
     body('password').isLength({ min: 12 }),
   ], (req, res) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
     }
   });
   ```

### 6. Data Encryption

**Recommendations:**
1. **Encryption at Rest**:
   - Enable Azure PostgreSQL encryption
   - Use Azure Key Vault for secrets
   - Encrypt sensitive fields (account numbers, SSNs)

2. **Encryption in Transit**:
   - Enforce TLS 1.2+ (already configured) ✅
   - Use HTTPS everywhere (Cloudflare SSL) ✅
   - Certificate pinning for mobile apps

3. **Field-Level Encryption**:
   ```typescript
   import crypto from 'crypto';
   
   // Encrypt sensitive data before storage
   function encrypt(text: string, key: string): string {
     const iv = crypto.randomBytes(16);
     const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
     // ... implementation
   }
   ```

### 7. Dependency Security

**Current State:** 11 vulnerabilities (7 moderate, 4 high) in dev dependencies

**Recommendations:**
1. **Run regular audits**:
   ```bash
   npm audit --production  # Check production deps
   npm audit fix            # Auto-fix where possible
   ```

2. **Use Snyk or Dependabot**:
   - GitHub Dependabot (free) ✅ Already configured
   - Snyk for detailed reports
   - WhiteSource Bolt

3. **Pin Dependencies**:
   ```json
   // Use exact versions in package.json
   "express": "4.21.2"  // Not "^4.21.2"
   ```

### 8. Error Handling

**Current State:** Standardized error responses, no stack traces in production ✅

**Best Practices:**
- Never expose internal paths
- Log errors with correlation IDs ✅
- Return generic messages to clients ✅
- Monitor error rates

### 9. File Upload Security

**If Implementing File Uploads:**
1. **Validate File Types**:
   ```typescript
   const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
   if (!allowedTypes.includes(file.mimetype)) {
     throw new Error('Invalid file type');
   }
   ```

2. **Size Limits**:
   ```typescript
   app.use(express.json({ limit: '10mb' })); // Already configured ✅
   ```

3. **Virus Scanning**:
   - Use ClamAV or cloud service
   - Scan before storage
   - Quarantine suspicious files

4. **Storage**:
   - Store outside web root
   - Generate random filenames
   - Use signed URLs for access
   - Implement access controls

### 10. Compliance

**PCI DSS (if processing payments):**
- Never store CVV codes
- Encrypt card data
- Use tokenization
- Annual security audits
- Network segmentation

**GDPR (if handling EU data):**
- Data processing agreements
- Right to erasure implementation
- Data portability
- Breach notification (72 hours)
- Privacy policy

**HIPAA (if handling health data):**
- Business associate agreements
- Access controls
- Audit trails ✅
- Encryption ✅
- Training requirements

---

## 🔍 Security Checklist

### Before Production Deployment

- [ ] All secrets in Azure Key Vault or AWS Secrets Manager
- [ ] TLS/SSL certificates installed and auto-renewing
- [ ] SESSION_SECRET is strong (32+ characters) ✅
- [ ] Rate limiting configured and tested ✅
- [ ] CORS origins restricted to production domains
- [ ] CSP headers properly configured ✅
- [ ] Database encryption at rest enabled
- [ ] Database in private subnet
- [ ] Firewall rules configured (ports 80, 443 only)
- [ ] DDoS protection enabled (Cloudflare) ✅
- [ ] WAF rules active (Cloudflare)
- [ ] Security headers passing securityheaders.com
- [ ] SSL Labs grade A+ on ssllabs.com
- [ ] OWASP ZAP scan completed
- [ ] Dependency audit clean for production deps
- [ ] Logging configured and tested ✅
- [ ] Monitoring and alerts active
- [ ] Backup and recovery tested
- [ ] Incident response plan documented
- [ ] Security training completed
- [ ] Penetration testing completed (recommended)

### Post-Deployment

- [ ] Monitor error rates first 24 hours
- [ ] Review access logs for anomalies
- [ ] Verify rate limiting is working
- [ ] Test WAF rules
- [ ] Verify backups are working
- [ ] Set up security alerts
- [ ] Schedule regular security reviews

---

## 📞 Security Contacts

**Report Security Issues:**
- Email: security@universalstandards.org
- Create private security advisory on GitHub
- Response time: Within 24 hours for critical issues

**Security Resources:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Node.js Security Best Practices: https://nodejs.org/en/docs/guides/security/
- Express Security Best Practices: https://expressjs.com/en/advanced/best-practice-security.html
- Azure Security: https://docs.microsoft.com/en-us/azure/security/

---

## 🔄 Regular Security Tasks

### Daily
- Review error logs
- Check security alerts
- Monitor unusual traffic patterns

### Weekly
- Run npm audit
- Review access logs
- Check certificate expiration
- Review user activity

### Monthly
- Security patch updates
- Dependency updates
- Access review (remove inactive users)
- Review firewall rules
- Rotate API keys (if applicable)

### Quarterly
- Full security audit
- Penetration testing (external)
- Compliance review
- Disaster recovery drill
- Update security documentation

---

**Last Updated:** January 9, 2026  
**Version:** 1.0  
**Maintainer:** Security Team
