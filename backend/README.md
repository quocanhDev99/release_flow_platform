# 🚀 Release Flow Platform - Backend API

> Progressive NestJS server for orchestrating release pipelines, deployment calendars, automated cron notifications, and auto release notes generation.

---

## 🛠️ Modules & Services

*   **`DeploymentWindowsModule`**: Manages deployment window slots, calendar schedules, and policies.
*   **`SchedulerModule`**:
    *   `CronService`: Automated daily deployment notifications (e.g. 8:00 AM daily alerts, 4:30 PM reminder to merge code).
    *   `ReleaseNotesService`: Generates categorized Markdown, responsive HTML emails, and coordinates 1-click broadcasts for any release window.
*   **`NotificationsModule`**: Multi-channel alert dispatchers (Telegram Bot, Microsoft Teams Adaptive Cards with `@mention`, Slack Webhooks, SMTP Email).
*   **`DeploymentItemsModule`**: CRUD and bulk updates for ticket items, Git branches, and developer assignments.
*   **`WebhooksModule`**: Inbound Webhook receivers for GitHub and Bitbucket merge events.
*   **`SettingsModule`**: System-wide settings and credentials storage in PostgreSQL.
*   **`PrismaModule`**: Database client and schema management.

---

## 📦 API Endpoints Overview

### Deployment Windows & Release Notes
*   `GET /api/deployment-windows`: List all deployment schedules.
*   `GET /api/deployment-windows/:id/release-notes`: Generate formatted release notes (Markdown, HTML email, structured KPI counts).
*   `POST /api/deployment-windows/:id/release-notes/broadcast`: Broadcast release handover report to Telegram/Teams/Slack/Email.
*   `POST /api/deployment-windows/notify`: Broadcast schedule updates to channels.
*   `GET /api/deployment-windows/cron/status`: Status of automated reminder cron jobs.
*   `POST /api/deployment-windows/cron/run/:jobId`: Manually trigger a cron job (`daily_reminder` or `tomorrow_reminder`).

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Prisma database migration & generate client
npx prisma migrate dev
npx prisma generate

# Run development server (watch mode)
npm run start:dev
```
