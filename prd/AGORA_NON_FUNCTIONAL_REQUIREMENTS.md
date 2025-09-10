# AGORA Non-Functional Requirements

## 1. Performance Requirements

- **Expected Load:**  
  - Support at least 1,000 concurrent users (scalable to 10,000+ with infrastructure upgrades).
  - Handle up to 100,000 events and 10,000 companies in the database.
- **Response Times:**  
  - 95% of API requests should respond in under 500ms.
  - Calendar and event views should load in under 2 seconds for typical users.
- **Scalability:**  
  - Horizontal scaling for both frontend and backend (containerized deployment, load balancers).
  - Database optimized with indexes, partitioning, and connection pooling.
  - Use of CDN for static assets and caching for frequently accessed data (e.g., weather, S&P500, company profiles).

## 2. Security Requirements

- **Authentication:**  
  - Microsoft Identity Platform (OAuth2/OpenID Connect) and Supabase Auth for user login.
  - Multi-factor authentication (MFA) required for admin roles.
- **Authorization:**  
  - Row Level Security (RLS) enforced at the database level.
  - Fine-grained access control for user roles (analyst, admin, executive assistant).
- **Data Protection:**  
  - AES-256 encryption at rest; TLS 1.3 for all data in transit.
  - Sensitive fields (PII, payment info) encrypted at the application level.
  - Regular security audits and vulnerability scanning.
- **GDPR & Compliance:**  
  - User data export and deletion on request.
  - Data retention policies and audit logging.
  - Privacy policy and terms of service available to all users.
- **Session Management:**  
  - Inactivity timeout (30 minutes default).
  - Device fingerprinting and concurrent session limits for sensitive roles.
- **Other:**  
  - Rate limiting on all APIs.
  - Audit logs for all data access and security events.

## 3. Accessibility Requirements

- **WCAG 2.1 Compliance:**  
  - All user-facing pages must meet at least AA level.
- **Keyboard Navigation:**  
  - All interactive elements accessible via keyboard.
- **Screen Reader Support:**  
  - Proper ARIA labels, roles, and semantic HTML.
- **Color Contrast:**  
  - Sufficient contrast for text and UI elements.
- **Responsive Design:**  
  - Fully functional on desktop, tablet, and mobile devices.
- **Testing:**  
  - Accessibility tested with tools like Axe, Lighthouse, and manual screen reader checks.

## 4. Deployment/Hosting Requirements

- **Hosting:**  
  - Cloud-based (e.g., AWS, Azure, GCP, or Supabase hosting).
  - Use of managed PostgreSQL (Supabase, RDS, or equivalent).
- **CI/CD:**  
  - Automated build, test, and deployment pipelines (GitHub Actions, GitLab CI, etc.).
  - Zero-downtime deployments for production.
- **Backup & Recovery:**  
  - Automated daily database backups.
  - Point-in-time recovery enabled.
  - Disaster recovery plan documented and tested.
- **Monitoring & Logging:**  
  - Application and infrastructure monitoring (Sentry, New Relic, Datadog, etc.).
  - Centralized logging for backend and frontend errors.
  - Alerting for critical failures and security incidents.
- **Environment Management:**  
  - Separate environments for development, staging, and production.
  - Environment variables managed securely (e.g., Vault, AWS Secrets Manager).

## 5. Office Add-in Specific Requirements

- **Add-in Distribution:**  
  - Deployment to Microsoft AppSource for public distribution.
  - Enterprise deployment via Microsoft 365 Admin Center for organizational users.
  - Side-loading capability for development and testing.
- **Office.js Compatibility:**  
  - Support for Office.js API version 1.1+ (current requirement sets).
  - Compatibility with Outlook Desktop, Outlook on the web, and Outlook mobile.
- **Manifest Requirements:**  
  - Valid Office Add-in manifest (XML format).
  - Proper domain allowlisting for HTTPS endpoints.
  - SSL/TLS certificates for all add-in domains.
- **Cross-Platform Support:**  
  - Windows Desktop Outlook (Office 2019, Office 365).
  - Mac Desktop Outlook (Office 2019, Office 365).
  - Outlook on the web (all modern browsers).
  - Outlook mobile (iOS and Android) - limited functionality.

## 6. Compliance & Legal Requirements

- **Data Sovereignty:**  
  - Data residency requirements for different regions (EU, US, etc.).
  - Compliance with local data protection laws.
- **Financial Data Compliance:**  
  - SOC 2 Type II compliance for handling financial data.
  - PCI DSS compliance for payment processing (via Stripe).
- **Enterprise Security:**  
  - Support for Single Sign-On (SSO) via Microsoft Identity Platform.
  - Integration with enterprise identity providers (Azure AD).
- **Terms & Privacy:**  
  - Clear privacy policy for data collection and usage.
  - Terms of service for subscription and service usage.

## 7. Business Continuity Requirements

- **Uptime:**  
  - 99.9% uptime SLA (approximately 8.77 hours downtime per year).
  - Planned maintenance windows communicated 48 hours in advance.
- **Data Retention:**  
  - User data retained for account lifetime + 1 year after deletion.
  - Audit logs retained for 7 years for compliance.
- **Geographic Distribution:**  
  - Multi-region deployment for disaster recovery.
  - Regional data centers for improved performance (US, EU).
- **Capacity Planning:**  
  - Auto-scaling based on demand patterns.
  - Capacity monitoring and proactive scaling alerts.

---

## Summary Table

| Category              | Requirement Highlights                                                                 |
|-----------------------|---------------------------------------------------------------------------------------|
| Performance           | 1,000+ concurrent users, <500ms API, scalable infra, CDN, caching                     |
| Security              | OAuth2, MFA, RLS, encryption, GDPR, audit logs, rate limiting                         |
| Accessibility         | WCAG 2.1 AA, keyboard/screen reader, color contrast, responsive, tested               |
| Deployment/Host       | Cloud, managed DB, CI/CD, backups, monitoring, multi-env, secure secrets              |
| Office Add-in         | AppSource distribution, Office.js compatibility, manifest, cross-platform             |
| Compliance & Legal    | Data sovereignty, SOC 2, PCI DSS, SSO, privacy policy, terms of service              |
| Business Continuity   | 99.9% uptime, data retention, multi-region, auto-scaling, capacity planning           |

---

**Tip:**  
Review these requirements with your team and stakeholders. Adjust thresholds and tools as needed for your specific business, compliance, and technical context.