# GOFAPS Product Roadmap

> **Government Operations, Financial, Accounting & Personnel System**  
> Maintained by the Office of Finance, Accounting & Personnel Services (OFAPS)  
> US Department of Special Projects and Unified Response Services

This roadmap reflects the current development trajectory for GOFAPS. Milestones are versioned and cumulative. Items within each milestone are listed in approximate delivery priority order.

For the current release status and production readiness details, see [`PRODUCTION_STATUS.md`](PRODUCTION_STATUS.md).  
For the complete feature inventory, see the [README](README.md#-core-modules).

---

## 🟢 Currently Active — `v0.1.x` Stabilization

> **Goal:** Harden the initial release to production-grade quality. No new module scope — only stability, coverage, and correctness.

### In Progress
- [ ] **Feature flag system** — Gate all partially-implemented UI routes and API endpoints behind a flag; unimplemented endpoints return `HTTP 501`
- [ ] **Test coverage to ≥90%** — Vitest suites for enhanced routes, bulk uploads, frontend report/card flows, and WebSocket event mocking
- [ ] **Real data wiring** — Replace remaining static mock data in reports, card management, direct deposit, and notification center with live API calls
- [ ] **WebSocket notifications** — Wire real-time employee dashboard event stream to backend (or implement polling fallback)
- [ ] **Performance baseline** — k6 / autocannon smoke tests on critical financial endpoints; results published as CI comment
- [ ] **WCAG 2.1 AA audit** — Remediate all Level A/AA accessibility failures; keyboard navigation verified on all interactive components
- [ ] **Console.log cleanup** — Replace remaining 93 `console.*` calls with Winston structured logger
- [ ] **Session cleanup job** — Scheduled cron to purge expired PostgreSQL sessions

### Acceptance Criteria for v0.1.x Close
- All core finance CRUD flows working with real data; zero placeholder mocks on production paths
- `npm run lint`, `npm run typecheck`, and `npm run test` clean; coverage ≥90%
- Feature-flagged navigation: only supported pages accessible
- Dockerized app starts with documented `.env` and passes all health checks

---

## 🟡 Next — `v0.2.0` Procurement, Fleet & Asset Management

> **Goal:** Complete the back-office operational modules enabling full source-to-pay and asset lifecycle management.

### Procurement & Contracting
- [ ] Solicitation management: IFB, RFP, RFQ, RFI, and sole-source justification workflows
- [ ] Public-facing electronic bid portal with vendor self-registration
- [ ] Bid tabulation, weighted scoring matrices, and automated award recommendations
- [ ] Contract lifecycle management: drafting, negotiation, execution, amendments, and closeout
- [ ] Cooperative purchasing agreements and piggyback contract tracking
- [ ] Small business / MBE / WBE / SDVOSB set-aside tracking and compliance reporting
- [ ] Strategic sourcing analytics: spend cube, vendor concentration risk, and supplier diversity dashboard

### Fleet Management
- [ ] Full vehicle lifecycle: acquisition request → receipt → preventive maintenance → disposal/auction
- [ ] Preventive maintenance scheduling with odometer/hour-meter and calendar triggers
- [ ] Work order management with labor, parts, and contractor cost capture
- [ ] Fuel card integration and per-vehicle fuel consumption analytics
- [ ] Motor pool vehicle reservation and dispatch management
- [ ] Telematics/GPS integration framework for real-time fleet positioning

### Asset Management
- [ ] Capital asset registry (GASB 34/35 compliant): land, buildings, infrastructure, equipment
- [ ] Automated depreciation (straight-line, declining balance, MACRS, units-of-production)
- [ ] Asset condition assessment workflows and useful life tracking
- [ ] Facilities maintenance work orders with priority triage and contractor dispatch
- [ ] Inventory management: reorder points, automated purchase triggers, RFID/barcode support

---

## 🟠 Upcoming — `v0.3.0` Constituent & Citizen Services

> **Goal:** Deliver configurable public-facing portals, enabling any agency to stand up a citizen-service interface tailored to its function.

### Core Platform
- [ ] Configurable portal framework: white-label, agency-branded, module-activated per deployment
- [ ] Citizen identity management (CIAM): federated SSO, OIDC, and optional PIV/CAC for government staff
- [ ] Citizen CRM: unified constituent profile across all service channels
- [ ] Multi-language support: 100+ languages via Google Translate API / Azure Cognitive Services
- [ ] Section 508 / WCAG 2.1 AA: full compliance audit and certification for all public-facing pages

### Agency-Specific Portal Modules
- [ ] **Utilities** — Online bill payment, usage history, service requests, outage reporting
- [ ] **Public Works** — Road repair requests, pothole reporting, project status tracking
- [ ] **Law Enforcement** — Non-emergency report filing, case status lookup, tip submission
- [ ] **Courts** — Fine payment, court date scheduling, document submission, case tracking
- [ ] **Permitting & Planning** — Permit applications, plan review status, inspection scheduling
- [ ] **Parks & Recreation** — Facility reservations, program registration, permit applications
- [ ] **Social Services** — Benefit applications, eligibility screening, case status, document upload
- [ ] **Tax Authority** — Online filing, payment plans, assessment appeals
- [ ] **Elections** — Voter registration, absentee ballot requests, polling location lookup

### Engagement Tools
- [ ] 311 / 411 non-emergency service request system with SLA tracking and public status dashboard
- [ ] Digital town halls with live polling, Q&A queue, and recording archival
- [ ] Participatory budgeting portal: citizen-facing budget proposal and voting system

---

## 🔵 Future — `v0.4.0` Intelligence & AI Augmentation

> **Goal:** Embed ATLANTIS.AI deeply into GOFAPS workflows, delivering predictive, autonomous, and conversational capabilities across all modules.

### ATLANTIS.AI Deep Integration
- [ ] **ARIA Digital Assistant** — 24/7 natural language assistant for constituents and staff; capable of answering queries, guiding processes, and completing tasks autonomously
- [ ] **Anomaly Detection Engine** — Continuous real-time monitoring of financial transactions for duplicate payments, budget overruns, and potential fraud
- [ ] **Intelligent Document Processing (IDP)** — OCR + AI extraction for invoices, contracts, and HR forms; auto-populate fields and route for approval
- [ ] **Smart Workflow Engine** — Self-learning approval routing that adapts based on historical approval patterns and workload
- [ ] **Natural Language Query Interface** — Query budgets, run reports, and initiate workflows using plain-language prompts

### Predictive Analytics
- [ ] ML-powered multi-year budget forecasting with confidence intervals
- [ ] Workforce demand modeling: staffing gap prediction and attrition risk scoring
- [ ] Cash flow forecasting with scenario branching
- [ ] Predictive maintenance for fleet and facilities based on condition data and usage history
- [ ] Vendor risk scoring: performance, financial health, and compliance risk models

### Spatial Intelligence
- [ ] GIS-integrated spatial analytics: infrastructure condition, service request clustering, asset mapping
- [ ] Real-time IoT data ingestion: traffic sensors, utility meters, environmental monitors, public safety devices

---

## 🔴 Target — `v1.0.0` Federal Production Certification

> **Goal:** Achieve federal-grade compliance certification, full mobile support, and the complete feature surface required for enterprise-wide US-SPURS deployment.

### Compliance & Certification
- [ ] FedRAMP High authorization package (3PAO assessment, SSP, SAR, POA&M)
- [ ] PIV / CAC smart card authentication for all government staff access
- [ ] FIPS 140-2 validated cryptographic modules throughout
- [ ] FISMA Annual Assessment package — controls tested, documented, and accepted
- [ ] SOC 2 Type II audit completed
- [ ] Section 508 Voluntary Product Accessibility Template (VPAT) published

### Reporting & Federal Submissions
- [ ] ACFR / Government-Wide Financial Statement auto-generation (GASB 34 compliant)
- [ ] SF-133, SF-134, and SF-224 cash reconciliation report generation
- [ ] USASpending.gov data feed: automated awards and subawards reporting
- [ ] DATA Act submission package automation (D1, D2, and financial data files)
- [ ] OMB MAX / Treasury Financing Account reporting integration

### Mobile & Field Operations
- [ ] Native iOS application (Swift/SwiftUI) — full feature parity with web
- [ ] Native Android application (Kotlin/Jetpack Compose) — full feature parity with web
- [ ] Offline-capable field operations: expense capture, work orders, asset scans (sync on reconnect)
- [ ] Mobile approval workflows: push notifications for pending reviews

### Advanced Platform
- [ ] AR/VR training simulation environment for law enforcement, fire, EMS, and corrections
- [ ] Wearable device integration: body cameras, smart glasses, health sensors, panic buttons
- [ ] Smart contract automation: blockchain-verified milestone-based procurement payments
- [ ] Interagency sharing portal: cross-agency resource and employee temporary assignment management
- [ ] Emergency Operations Center (EOC) module: COOP planning, resource tracking, incident dashboards

---

## 📐 Version Timeline (Projected)

| Version | Target | Focus |
|---|---|---|
| `v0.1.x` | Q2 2026 | Stabilization: coverage, real data, flags |
| `v0.2.0` | Q3 2026 | Procurement, fleet, asset management |
| `v0.3.0` | Q4 2026 | Constituent services, citizen portals |
| `v0.4.0` | Q1 2027 | ATLANTIS.AI integration, predictive analytics |
| `v1.0.0` | Q3 2027 | FedRAMP, full mobile, federal reporting |

---

## 💬 How to Influence the Roadmap

- **File a Feature Request** using the [Feature Request issue template](../../issues/new?template=feature_request.md)
- **Comment on an existing issue** to add context, upvote priority, or offer implementation help
- **Open a GitHub Discussion** for broader architectural or strategic conversations
- **Contact OFAPS** at gofap@ofaps.spurs.gov for enterprise or agency-specific requirements

---

*Maintained by the Office of Finance, Accounting & Personnel Services (OFAPS)*  
*US Department of Special Projects and Unified Response Services · spurs.gov*  
*Last updated: April 2026*
