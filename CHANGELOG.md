# Changelog

All notable changes to **GOFAPS** (Government Operations, Financial, Accounting & Personnel System) are documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/) and the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

---

## [Unreleased]

### In Progress
- Feature flag system for partially-implemented modules
- WCAG 2.1 AA accessibility audit and remediation
- Vitest coverage increase toward ≥ 90% on all core modules
- WebSocket real-time event streaming for employee dashboard notifications
- Full replacement of static mock data in reports, card management, and direct deposit flows with live API calls
- Performance smoke tests (k6 / autocannon) on critical financial endpoints

### Planned — v0.2.0
- Full procurement lifecycle: solicitation → bid tabulation → award → contract execution
- Fleet management: acquisition request → preventive maintenance → disposal/auction
- Capital asset registry (GASB 34/35 compliant) with automated depreciation
- Inventory and supply chain management with reorder automation
- Small business / set-aside tracking and reporting

### Planned — v0.3.0
- Configurable public-facing constituent portals (utilities, public works, law enforcement, courts, elections)
- 311/411 non-emergency service request system with public SLA visibility
- Citizen CRM with unified constituent profiles
- Multi-language support (100+ languages via Google Translate / Azure Cognitive)
- Digital town halls and participatory budgeting portal

### Planned — v0.4.0
- ATLANTIS.AI deep integration: ARIA digital assistant, anomaly detection, IDP for invoices/contracts
- Predictive budget forecasting using ML models
- GIS-integrated spatial analytics for infrastructure and service requests
- Smart workflow engine with self-learning approval routing

### Planned — v1.0.0 (Federal Production-Ready)
- FedRAMP authorization package preparation
- PIV/CAC card authentication support
- ACFR / Government-Wide Financial Statement auto-generation
- USASpending.gov data feed integration
- Native iOS and Android mobile applications
- IoT data ingestion pipeline (traffic sensors, utility meters, public safety devices)
- AR/VR training simulation environment
- Full SOC 2 Type II audit

---

## [0.1.0] — 2025-09-08 (Initial Release)

### Added

#### Core Infrastructure
- Initial repository scaffold: React 18 + TypeScript frontend, Node.js / Express backend, Drizzle ORM + PostgreSQL (Neon) database
- Vite build pipeline with hot module replacement for development
- TypeScript strict mode with ESLint + Prettier configuration
- Vitest test suite with initial unit and integration coverage
- Docker + Docker Compose configuration for local and production deployments
- PM2 `ecosystem.config.js` for process management
- systemd `gofaps.service` unit file for Linux production hosts
- NGINX reverse proxy configuration (`nginx.conf`)
- Terraform infrastructure-as-code scaffolding (`infra/` directory)
- GitHub Actions multi-platform deploy workflow (AWS EC2, UpCloud, Azure, Vercel, Render)
- One-click "Deploy to selected platform" badge and workflow trigger

#### Authentication & Security
- Replit Auth / OpenID Connect (OIDC) integration
- PostgreSQL-backed express-session with configurable TTL
- Organization-level data isolation in all Drizzle queries
- Role-based access control (RBAC) middleware
- Fail-fast environment variable validation (`server/env-validator.ts`)
- Helmet.js security headers (CSP, HSTS, X-Frame-Options, etc.)
- CSRF protection for state-changing operations
- Structured audit logging middleware

#### Financial Management Module
- Multi-fund general ledger with unlimited fund structures
- Fiscal year budget management with categories and encumbrance tracking
- Budget vs. actual variance calculation and reporting
- Digital wallet infrastructure: checking, savings, payroll, expense, tax collection account types
- Accounts payable: vendor invoice processing, 3-way matching, ACH payment disbursement
- Accounts receivable: customer invoicing, payment plan tracking, aging reports
- Multi-type payment processing: vendor payments, payroll, expense reimbursements, tax remittance, inter-fund transfers
- Comprehensive financial transaction log (immutable)
- Stripe SDK integration for card payment processing
- Modern Treasury integration for ACH / wire operations
- PayPal integration for alternative payment acceptance
- Unit.co integration for digital banking account management

#### Human Resources Module
- Employee record management (position, compensation, benefits, employment history)
- Organizational chart and position control
- Job requisition and applicant tracking workflows
- Onboarding task checklist and document management
- Payroll processing with multi-jurisdiction tax withholding
- Benefits administration: open enrollment, COBRA, FSA/HSA tracking
- Performance review cycle management
- Leave request and balance tracking (FMLA, PTO, sick, military)
- Employee Self-Service (ESS) and Manager Self-Service (MSS) portals

#### Procurement Module
- Vendor registration and qualification management
- Purchase order creation and change order management
- Purchase card (P-card) program management
- Vendor payment processing with early payment discount capture
- Vendor performance scorecards

#### Dashboard & Analytics
- Executive dashboard with real-time KPI tiles
- Budget overview widgets with drill-down capability
- Recent activity feed and pending action queues
- Payment history and transaction search
- Modular widget architecture for customizable layouts

#### Developer Experience
- `DEVELOPMENT.md` local setup guide
- `DEPLOYMENT_README.md` general deployment guide
- `EC2_DEPLOYMENT_GUIDE.md` AWS EC2-specific instructions
- `DEPLOYMENT_UPCLOUD.md` UpCloud deployment instructions
- `AZURE_CLOUDFLARE_DEPLOYMENT.md` Azure + Cloudflare deployment
- `FREE_TIER_DEPLOYMENT.md` zero-cost deployment (Oracle Always Free, Fly.io, Render)
- `DEPLOYMENT_CHECKLIST.md` pre-launch checklist
- `DEPLOYMENT_WORKFLOW.md` CI/CD pipeline documentation
- `SECURITY.md` security policy and vulnerability reporting
- `SECURITY_RECOMMENDATIONS.md` hardening guide
- `PRODUCTION_AUDIT.md` production readiness audit log
- `PRODUCTION_STATUS.md` current status tracker
- `IMPLEMENTATION_SUMMARY.md` feature completion tracker
- `ROADMAP.md` development roadmap and acceleration plan

### Changed
- *(Initial release — no prior version)*

### Fixed
- *(Initial release — no prior version)*

---

## [Pre-Release] — 2024-06-09 (Legacy Python Prototype)

### Added
- Original Python prototype: `UniversalStandards/New-Government-agency-banking-Program`
- Stripe and Modern Treasury API integration proofs-of-concept
- Initial GOFAP concept documentation and feature specification
- Banking-as-a-service account creation workflows (Unit.co, SolidFi)
- Early constituent services portal concept
- First GOFAP README with feature overview, API integration map, and HR capability spec

### Notes
- This prototype has been superseded by the TypeScript full-stack implementation in `UniversalStandards/GOFAP`
- See [`UniversalStandards/New-Government-agency-banking-Program`](https://github.com/UniversalStandards/New-Government-agency-banking-Program) for historical reference

---

## Version History Summary

| Version | Date | Status | Highlights |
|---|---|---|---|
| `Unreleased` | Active | 🔄 In Development | Feature flags, coverage uplift, real API wiring |
| `0.1.0` | 2025-09-08 | ✅ Released | Core financial, HR, procurement, dashboard, multi-platform deploy |
| `Pre-Release` | 2024-06-09 | 🗂️ Archived | Python prototype (legacy) |

---

*Maintained by the Office of Finance, Accounting & Personnel Services (OFAPS)*  
*US Department of Special Projects and Unified Response Services · spurs.gov*
