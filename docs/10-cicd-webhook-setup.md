# Inbound Webhooks Setup (CI/CD)

This document explains how to integrate the **Release Flow Platform** with source code repositories (**GitHub**, **Bitbucket**) to fully automate the creation of deployment items upon code changes.

---

## ⚙️ 1. GitHub Webhook Configuration

Once configured successfully, GitHub will send a Payload every time a Pull Request (PR) is merged, allowing the system to automatically record the event.

1.  Navigate to your Repository settings on **GitHub**.
2.  Go to the **Settings** tab -> select **Webhooks** from the left sidebar.
3.  Click the **Add webhook** button in the top right corner.
4.  Enter the following parameters:
    *   **Payload URL:** `http://<your-domain>/api/webhooks/github` *(Local testing: `http://localhost:3000/api/webhooks/github`)*.
    *   **Content type:** Select `application/json`.
    *   **Which events... (Trigger events):** Choose **Let me select individual events** -> Only check **Pull requests** (uncheck Pushes and others).
5.  Click **Add webhook** to complete.

---

## ⚙️ 2. Bitbucket Webhook Configuration

1.  Navigate to your Repository on **Bitbucket**.
2.  Select **Repository settings** from the left sidebar -> find **Webhooks**.
3.  Click the **Add webhook** button at the top.
4.  Enter the information:
    *   **Title:** `Release Flow Platform Webhook`
    *   **URL:** `http://<your-domain>/api/webhooks/bitbucket` *(Local testing: `http://localhost:3000/api/webhooks/bitbucket`)*.
    *   **Triggers:** Under **Pull Request** -> Check **Merged** (or *Fulfilled*).
5.  Click **Save**.

---

## 🔍 3. Automated Parsing & Deduplication Engine

When a Webhook payload hits the API:
1.  **Ticket ID Detection:** The system automatically scans for the regex `MAG-\d+` (e.g., `MAG-20888`) within the PR Title or source branch name.
2.  **Release Stream Mapping:** The system parses the target branch (Base branch) to map the fix version:
    *   Branches containing `release/1.12` -> map to `sow/1.12.x`.
    *   `main` / `master` branches -> map to `sow/main`.
    *   `dev` / `develop` branches -> map to `sow/dev`.
3.  **Safe Deduplication:** The system checks the database for duplicates. If the Ticket is already registered for that Repository and Release Version, the system gracefully ignores the duplicate record to prevent Dashboard clutter.
