# Free Cloud Deployment Guide

This document provides a detailed guide on how to deploy the entire **Release Flow Platform** (Angular + NestJS + PostgreSQL) to the most stable free cloud platforms available, along with managing APIs and viewing database records visually.

---

## 🏗️ Cloud Deployment Architecture

```mermaid
flowchart TD
    Client([User Browser])
    Vercel[Frontend Host: Vercel]
    Render[Backend Host: Render]
    Supabase[Database Host: Supabase / Neon]

    Client -- HTTPS (UI requests) --> Vercel
    Client -- API Requests (/api) --> Render
    Render -- Prisma Client Connection --> Supabase
```

Since the core MVP logic does not require Redis, we only need to deploy three main components:
1. **Frontend (Angular)**: Deploy to **Vercel** or **Netlify** (Free, high-speed CDN).
2. **Backend (NestJS)**: Deploy to **Render** or **Koyeb** (Free Node.js runtime).
3. **Database (PostgreSQL)**: Deploy to **Supabase** or **Neon.tech** (Free managed cloud PostgreSQL).

---

## 🗄️ Step 1: Initialize PostgreSQL Database on Supabase

### Recommended: **Supabase**
Supabase provides a real PostgreSQL database with a visual Table Editor (like Excel) directly in the browser.

1. Go to [Supabase.com](https://supabase.com/) and sign up for a free account via GitHub.
2. Create a new Project (e.g., `release-flow-db`). Set a strong database password and select the closest server region.
3. Once the Project is provisioned, go to **Project Settings** -> **Database**.
4. Retrieve your **Connection String** (Transaction or Session mode):
   ```text
   postgresql://postgres.[YOUR-PROJECT-ID]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```
   *(Remember to replace `[YOUR-PASSWORD]` with your actual password).*

---

## 🔌 Step 2: Deploy NestJS Backend to Render

Render hosts Node.js applications for free and automatically rebuilds upon every GitHub push.

1. Push your source code to a **GitHub** repository.
2. Log into [Render.com](https://render.com/) using GitHub.
3. Click **New** -> **Web Service**.
4. Connect your GitHub repository.
5. Configure the Web Service:
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start:prod`
   * **Instance Type**: `Free`
6. Click **Advanced** -> **Add Environment Variable** to add mandatory variables:
   * `DATABASE_URL`: Paste the Connection String from Supabase (Step 1).
   * `PORT`: `3000`
7. Click **Create Web Service**. Once built, Render will provide a free URL (e.g., `https://release-flow-backend.onrender.com`).

> [!NOTE]
> **Render Free Tier Limit:** If there is no incoming traffic for 15 minutes, the Render server will sleep. The next request will take ~50 seconds to spin the server back up.

---

## ⚡ Step 3: Run Database Migrations on the Cloud

To create the table schemas on your new Supabase database:
1. Open your local `backend/.env` file, temporarily replace the `DATABASE_URL` with your Supabase Connection String.
2. Open a terminal in the `backend` directory and run the migration:
   ```bash
   npx prisma migrate deploy
   ```
3. Run the seed script to inject default user data (`john_doe`, `alice_smith`):
   ```bash
   npx prisma db seed
   ```
4. *Important:* Revert your local `.env` file back to the localhost connection to avoid impacting local development.

---

## 💻 Step 4: Deploy Angular Frontend to Vercel

Vercel is the most optimized platform for hosting Single Page Applications (SPAs) like Angular.

### 1. Adjust API Endpoint
Before deploying, point Angular's API to your Render backend instead of localhost:
Open `frontend/src/app/services/release.service.ts` and update `apiUrl`:
```typescript
private apiUrl = 'https://release-flow-backend.onrender.com/api';
```

### 2. Configure Route Fallback (SPA Routing)
To prevent `404 Not Found` errors when users hit F5 on sub-routes (like `/login`), create a `vercel.json` file in the root of your `frontend` directory:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 3. Deploy on Vercel
1. Log into [Vercel.com](https://vercel.com/) via GitHub.
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Project Configuration:
   * **Framework Preset**: Select `Angular`.
   * **Root Directory**: `frontend`
5. Click **Deploy**. Vercel will build and assign a free HTTPS domain (e.g., `https://release-flow.vercel.app`).

---

## 🔎 Step 5: How to Manage and View Database Records?

You have 3 convenient ways to view and edit data visually:

### Method 1: Supabase Table Editor (Recommended)
* Log into Supabase admin console.
* Go to your project -> Click **Table Editor** on the left sidebar.
* You can view tables like `users`, `deployment_items`, `tickets` as a grid.
* Filter data, add rows, edit cell values, or delete records exactly like Excel.

### Method 2: Local Prisma Studio (Cloud DB Access)
You can launch Prisma's DB manager locally but point it to the cloud:
1. Temporarily point `DATABASE_URL` in `backend/.env` to Supabase.
2. Run this command in the `backend` folder:
   ```bash
   npx prisma studio
   ```
3. Your browser will open `http://localhost:5555`, displaying cloud data for editing.

### Method 3: DBeaver / pgAdmin (Client Tools)
* Download a free DB client like **DBeaver**.
* Create a new PostgreSQL connection, enter the Host, Port (5432), Database Name, Username, and Password from your Supabase settings.