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

All technical deep-dives are stored in the `docs/` directory. **This README serves as the Single Source of Truth**, overriding any conflicting details in child documents.

| Document | Detailed Content |
| :--- | :--- |
| 📄 [docs/01-overview.md](docs/01-overview.md) | **Overview:** Project vision and Concept Mindmap. |
| 📄 [docs/02-business-flow.md](docs/02-business-flow.md) | **Business Flow:** Normal Release and Hotfix flow diagrams. |
| 📄 [docs/03-domain-model.md](docs/03-domain-model.md) | **Domain Model:** Object-oriented design for scalability. |
| 📄 [docs/04-architecture.md](docs/04-architecture.md) | **Architecture:** System layers (Presentation, App, Domain, Infra). |
| 📄 [docs/05-database.md](docs/05-database.md) | **Database:** Normalized ERD for the MVP. |
| 📄 [docs/06-api.md](docs/06-api.md) | **REST API:** NestJS Server Endpoints specification. |
| 📄 [docs/07-deployment.md](docs/07-deployment.md) | **Deployment:** Guide to deploy on Vercel, Render, and Supabase. |
| 📄 [docs/08-roadmap.md](docs/08-roadmap.md) | **Roadmap:** Detailed plan from MVP to V4. |
| 📄 [docs/09-future-architecture-proposals.md](docs/09-future-architecture-proposals.md) | **Future Plans:** Advanced feature proposals (Phase 2+). |
| 📄 [docs/10-cicd-webhook-setup.md](docs/10-cicd-webhook-setup.md) | **Inbound Webhooks:** GitHub/Bitbucket setup guide. |
| 📄 [docs/11-setup-notifications.md](docs/11-setup-notifications.md) | **Outbound Alerts:** Telegram, Email, Teams, Slack setup guide. |

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