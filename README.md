# 🚀 Release Flow Platform

> **Internal Release Intelligence Platform** - A comprehensive solution to track, manage, and automate source code changes from Development to Production, fully replacing manual Excel spreadsheet management.

---

## 🌟 Vision & Problem Statement

Many enterprise teams still manage software release schedules using manual Excel spreadsheets. This leads to severe issues:
*   **Zero Visibility:** Dev, QA, and Ops teams lack a Single Source of Truth to track release progress.
*   **Missed Deployments:** Absence of automated reminders causes teams to miss golden deployment windows.
*   **Untrackable Releases:** Extremely difficult to cross-reference code changes (SHAs) or specific versions with deployment environments and times.
*   **Manual Planning:** Repetitive manual data entry is error-prone and unscalable for high-velocity deployments.

**Our Vision:** Build a powerful automation platform that directly connects with CI/CD systems, serving as an Intelligence Hub to orchestrate all enterprise release flows visually, accurately, and automatically.

---

## ✨ Core Features

*   **Excel-like Dashboard:** Provides a flat, Excel-like user interface supporting cross-filtering, dynamic sorting, and Bulk Actions.
*   **Tree-indented Grouping:** Automatically categorizes release streams into a clear visual hierarchy (`ReleaseGroup` -> `Sub-release` -> `Patch`).
*   **CI/CD Webhook Automation:** Integrates directly with GitHub and Bitbucket. Automatically extracts Ticket IDs (`MAG-\d+`), branch names, authors, maps them to the correct target version, and filters out duplicates safely.
*   **Interactive Scheduler:** Manages multi-environment deployment schedules on an interactive month calendar grid.
*   **Automated Cron Reminders:** Automatically sends daily broadcast alerts for today's and tomorrow's upcoming deployments (e.g. 8:00 AM daily alerts, 4:30 PM reminder to merge code).
*   **AI OCR Scanner:** Automatically scans and digitizes schedule information from images (spreadsheets, emails) directly into the database without manual input.
*   **ChatOps & Notifications:** Broadcasts real-time multi-channel alerts (Telegram, Email, Slack, Teams) upon significant changes. Features Microsoft Teams Adaptive Cards with automatic user @mentions based on UPNs. Supports both **System-wide Webhooks** and **Personal Notifications** for individual user preferences.
*   **System Settings UI:** Allows Administrators to configure API Tokens and Webhook URLs directly via the Web UI without modifying source code or `.env` files.

---

## 🛠️ Tech Stack

The system is designed with a **Normalized Backend** model while displaying a **Flat Frontend** interface for the best user experience.

*   **Frontend:** Angular 20, Angular Material, SCSS (BEM), Angular Signals (State Management).
*   **Backend:** NestJS, Prisma ORM, PostgreSQL.
*   **Automation:** GitHub/Bitbucket Webhooks, MS Teams Adaptive Cards, Slack Incoming Webhooks.

---

## 📖 Docs Index

All technical deep-dives and architectural diagrams are stored in the `docs/` directory, which is structured by domain for maximum extensibility. **This README serves as the Single Source of Truth**, overriding any conflicting details in child documents.

### 01. Product Overview
| Document | Detailed Content |
| :--- | :--- |
| 📄 [Vision & Scope](docs/01-Product-Overview/01.1-vision-and-scope.md) | Project vision and Concept Mindmap. |
| 📄 [Business Flow](docs/01-Product-Overview/01.2-business-flow.md) | Normal Release and Hotfix flow diagrams. |
| 📄 [Roadmap](docs/01-Product-Overview/01.3-roadmap.md) | Detailed plan from MVP to V4. |

### 02. Architecture
| Document | Detailed Content |
| :--- | :--- |
| 📄 [System Architecture](docs/02-Architecture/02.1-system-architecture.md) | System layers (Presentation, App, Domain, Infra). |
| 📄 [Domain Model](docs/02-Architecture/02.2-domain-model.md) | Object-oriented design for scalability. |
| 📄 [Database Schema](docs/02-Architecture/02.3-database-schema.md) | Normalized ERD for the MVP. |
| 📄 [Future Proposals](docs/02-Architecture/02.4-future-proposals.md) | Advanced feature proposals (Phase 2+). |

### 03. Features & Usecases (Diagrams)
| Document | Detailed Content |
| :--- | :--- |
| 📄 [Deployment Scheduler](docs/03-Features-and-Usecases/03.1-deployment-scheduler.md) | Use Case & Sequence Diagrams for scheduling. |
| 📄 [CI/CD Webhooks](docs/03-Features-and-Usecases/03.2-cicd-automation.md) | Use Case & Sequence Diagrams for PR webhook handling. |
| 📄 [AI OCR Scanner](docs/03-Features-and-Usecases/03.3-ai-ocr-scanner.md) | Use Case & Sequence Diagrams for Image-to-JSON extraction. |
| 📄 [Automated Reminders](docs/03-Features-and-Usecases/03.4-automated-reminders.md) | Use Case & Sequence Diagrams for daily Cron jobs. |
| 📄 [ChatOps Notifications](docs/03-Features-and-Usecases/03.5-chatops-notifications.md) | Use Case & Sequence Diagrams for event broadcasts. |
| 📄 [System Settings](docs/03-Features-and-Usecases/03.6-system-settings.md) | Use Case & Sequence Diagrams for Settings Configuration API. |
| 📄 [Dashboard Management](docs/03-Features-and-Usecases/03.7-dashboard-management.md) | Dashboard UI, Grouping, State Persistence. |

### 04. API Reference
| Document | Detailed Content |
| :--- | :--- |
| 📄 [REST API](docs/04-API-Reference/04.1-rest-api.md) | NestJS Server Endpoints specification. |

### 05. Operations Guide
| Document | Detailed Content |
| :--- | :--- |
| 📄 [Deployment Guide](docs/05-Operations-Guide/05.1-deployment-guide.md) | Guide to deploy on Vercel, Render, and Supabase. |
| 📄 [CI/CD Webhook Setup](docs/05-Operations-Guide/05.2-cicd-webhook-setup.md) | Inbound Webhooks: GitHub/Bitbucket setup guide. |
| 📄 [Setup Notifications](docs/05-Operations-Guide/05.3-setup-notifications.md) | Outbound Alerts: Telegram, Email, Teams, Slack setup guide. |

---

## 🚀 Quick Start

**Requirements:** Node.js (`v22.x`), Docker Desktop.

**1. Start Database (PostgreSQL)**
```bash
docker compose up -d
```

**2. Start Backend**
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run start:dev
```
*(Backend runs at: `http://localhost:3000`)*

**3. Start Frontend**
```bash
cd frontend
npm install
npm run start
```
*(Open browser at: `http://localhost:4230`)*

---

## 🗺️ Product Roadmap

*   **V1 (MVP):** Flat Excel-like interface, Tree hierarchy, account management, UI Theme swapping.
*   **V2 & V2.5 (Current):** CI/CD Webhooks automation, Multi-channel ChatOps (Teams/Slack/Email/Telegram). Interactive Calendar and AI OCR Scanner. System Settings Configuration UI.
*   **V3 (Planned):** QA/QC Verification Hub, Role-Based Access Control (RBAC), Jira Blocker validation.
*   **V4 (Planned):** Analytics Dashboard & Automated Changelog Generator (PDF/Markdown).

👉 *View detailed roadmap: [docs/08-roadmap.md](docs/08-roadmap.md)*