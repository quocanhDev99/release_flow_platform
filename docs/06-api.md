# REST API (MVP V1 & V2.5)

## Dashboard
* **GET `/dashboard`**: Displays the aggregated dashboard data (Excel-like view) grouped by Repos (`Core`, `E-com`) and statistical metrics (total merged tickets, pending QC, etc.).

---

## Release Streams (Fix versions)
* **GET `/releases`**: Lists all available Fix versions (e.g., `som/1.9.6`, `som/1.12.x`).
* **POST `/releases`**: Creates a new Fix version.
* **PUT `/releases/{id}`**: Updates a Fix version.
* **DELETE `/releases/{id}`**: Deletes a Fix version.

---

## Deployment Items (Ticket Data Rows)
*   **GET `/deployment-items`**: Retrieves all Tickets with detailed information (filterable by Repo, Fix Version, QC Status, etc.).
*   **POST `/deployment-items`**: Creates a new Ticket record (typically triggered by Git Webhooks upon a branch merge event).
*   **GET `/deployment-items/{id}`**: Views a specific Ticket detail.
*   **PUT `/deployment-items/{id}`**: Updates any field of a Ticket (e.g., build environment, QC status, pending notes).
*   **DELETE `/deployment-items/{id}`**: Deletes a Ticket record.
*   **POST `/deployment-items/bulk-delete`**: Deletes multiple Ticket records simultaneously (Payload: `{ ids: number[] }`).
*   **POST `/deployment-items/bulk-update`**: Updates multiple Ticket records simultaneously (Payload: `{ ids: number[], releaseStreamId?: number | null, qcStatus?: string }`).
*   **PATCH `/deployment-items/{id}/merge-devel`**: Quick toggle for the "Merge on Devel" checkbox.
*   **PATCH `/deployment-items/{id}/qc`**: Quick toggle for the "Ready For QC" status.

---

## Deployment Windows (Schedules)
*   **GET `/deployment-windows`**: Retrieves all schedules.
*   **POST `/deployment-windows`**: Creates a new schedule.
*   **PUT `/deployment-windows/{id}`**: Updates schedule details (Build Environment, Build Time, Fix Version).
*   **DELETE `/deployment-windows/{id}`**: Deletes a schedule.
*   **POST `/deployment-windows/clear-month`**: Deletes all schedules within a specific month (used prior to AI OCR sync).

---

## System Settings
*   **GET `/settings`**: Retrieves current system configurations (Webhook URLs, Telegram tokens, etc.).
*   **POST `/settings`**: Saves new system configurations.
*   **POST `/settings/test-notification`**: Triggers a multi-channel test notification.

---

## Authentication & User Settings
* **POST `/users/register`**: Registers a new developer account.
* **POST `/users/login`**: Authenticates user credentials and returns the user profile (excluding password).
* **PATCH `/users/{id}/theme`**: Configures the Light/Dark mode preference for the current user and saves it to the database.
* **PUT `/users/{id}`**: Updates user profile details, including personal notification preferences (Telegram Chat ID, Slack/Teams Webhook URLs, and Email notifications).