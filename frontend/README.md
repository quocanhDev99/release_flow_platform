# 🚀 Release Flow Platform - Frontend Application

> Modern Angular 19 application utilizing Signals, Angular Material, Quill.js Rich Text, and responsive Indigo/Slate Design Tokens.

---

## 🧩 Components Architecture

*   **`DashboardComponent`**: High-performance Excel-like grid supporting sorting, multi-criteria filtering, bulk actions, and rich Quill.js editors.
*   **`SchedulerComponent`**: Interactive deployment month calendar with real-time day breakdown, time-slot scheduling, and date-range OCR synchronization.
*   **`ReleaseNotesDialogComponent`**: Enterprise release notes generator with multi-format previews:
    *   **Visual Handover:** Stat cards, Jira hyperlinks, and QA verification checklist.
    *   **Markdown:** Formatted GitHub/Confluence markdown with 1-click clipboard copy and `.md` download.
    *   **Email (HTML):** Rich HTML email markup copyable directly into Microsoft Outlook and Gmail.
    *   **Broadcast:** Multi-channel broadcast dispatcher (Telegram, MS Teams, Slack, Email).
*   **`DashboardSidebarComponent`**: Drawer sidebar for Channel Notifications, Automated Cron Schedules, and Deployment Policies.
*   **`ToastComponent`**: Lightweight floating notification service (`success`, `warn`, `error`, `info`).
*   **`CommandPaletteComponent`**: Global shortcut palette (`Cmd+K` / `Ctrl+K`) for quick navigation and actions.

---

## 🛠️ Development & Build

```bash
# Install dependencies
npm install

# Start local development server (port 4500)
ng serve --port=4500

# Build production bundle
npm run build
```
