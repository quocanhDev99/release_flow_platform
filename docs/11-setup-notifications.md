# Outbound Notifications Setup (Telegram, Email, Teams & Slack) 🔔

The Release Flow Platform supports multi-channel alerts (Slack, Teams, Telegram, Email) whenever a Deployment Item or Schedule is created/updated/deleted, or imported via AI OCR.

This document guides you through quickly setting up **Telegram, Email (Gmail SMTP), MS Teams, and Slack** for both team-wide broadcasts and personal direct messages.

## 🎯 Notification Scopes: System vs Personal

The platform supports two independent layers of notifications to prevent alert fatigue and ensure the right people get the right messages:

1. **System-wide Notifications (Global / Team Channel)**
   * **Purpose:** Broadcasts major events (new schedules, OCR imports, deployments) to a shared team channel (e.g., `#deployments` on Slack, or a Telegram Group).
   * **Configured via:** Click the ⚙️ (**System Settings**) icon in the top right corner.
   * **Requirement:** Admins *must* configure the `Telegram Bot Token` and `SMTP Host/Credentials` here for the system to be able to send *any* Telegram messages or Emails, even personal ones.

2. **Personal Notifications (Direct Messages)**
   * **Purpose:** Sends Direct Messages (DMs) to individual developers for updates directly relevant to them (e.g., their ticket status changes).
   * **Configured via:** Click your User Avatar -> **Profile** -> **Personal Direct Messages** section.
   * **Usage:** Enter your personal `Telegram Chat ID`, a Webhook URL that points to a private DM with yourself in Slack/Teams, or toggle `Receive Email Notifications`.

> [!TIP]
> **No `.env` required:** Since V2.5, all of the above configurations are done entirely via the Web UI!

---

## 1. Telegram Setup ✈️

To receive alerts via Telegram, you must create a Bot and obtain your Chat ID.

### Step 1: Create a Bot and get `TELEGRAM_BOT_TOKEN`
1. Open Telegram and search for **@BotFather**.
2. Send the `/newbot` command to create a new bot.
3. Enter a display name (e.g., `RFP Alerts Bot`).
4. Enter a username (must end in `bot`, e.g., `rfp_alerts_bot`).
5. **BotFather** will reply with your **Bot Token** (Format: `123456789:ABCdefGHIjklMNOpqrSTUvwxYZ`). 
6. **Save this Token securely!**

### Step 2: Get your `TELEGRAM_CHAT_ID`
1. Start your newly created bot by searching its username and clicking **Start**.
2. Send any message to the bot (e.g., `Hello`).
3. Open a browser and visit this URL (replace `<YOUR_BOT_TOKEN>`):
   `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. In the returned JSON, locate `"chat": {"id": 123456789, ...}`. The number `123456789` is your **Chat ID**.
5. **Save this Chat ID!**

### Step 3: Apply Configuration
Open the **System Settings** page -> **Alerts & Notifications** tab, enter your `Bot Token` and `Chat ID`, then click **Test Telegram**.

---

## 2. Email Setup (Gmail SMTP) 📧

The simplest way to enable automated emails is to use a personal Gmail account combined with Google's **App Password** feature.

### Step 1: Enable 2-Step Verification (2FA)
1. Log into your [Google Account](https://myaccount.google.com/).
2. Select **Security** from the left menu.
3. Ensure **2-Step Verification** is **ON**.

### Step 2: Create an App Password
1. Under Security, click **2-Step Verification**.
2. Scroll down and select **App passwords**.
3. Enter an app name (e.g., `Release Flow Platform`) and click **Create**.
4. A 16-character password (e.g., `abcd efgh ijkl mnop`) will appear. 
5. **Save this password!** Do NOT use your real Gmail password.

### Step 3: Apply Configuration
Open the **System Settings** page -> **Alerts & Notifications** tab, enter the Host (`smtp.gmail.com`), Port (`587`), Sender Email, App Password, and Recipient Email, then click **Test Email**.

---

## 3. Microsoft Teams Setup 👥

The system utilizes Microsoft's **Adaptive Cards** format to send highly visual, beautiful alerts capable of automatically `@mentioning` users based on their UPN (User Principal Name / System Email).

### Step 1: Create a Webhook
Due to Microsoft Teams having two versions (Classic and New), instructions vary:

**For New Teams (Build from scratch - Recommended)**
1. Open Teams and go to your desired Channel.
2. Click the `(...)` menu in the top right -> select **Workflows**.
3. In the dialog, click the **`+ Build from scratch`** button in the top right corner.
4. Click **Build with Power Automate to see more triggers** at the bottom.
5. In the Power Automate search bar, type: `webhook`.
6. Select the trigger: **When a Teams webhook request is received**.
7. Add the next Action: **Post card in a chat or channel**, configuring it to post as an Adaptive Card in your current channel.
8. Click **Save**. The system will generate a very long URL. **Copy this URL!**

### Step 2: Apply Configuration
Open the **System Settings** page -> **Alerts & Notifications** tab, paste the URL into the **Microsoft Teams Webhook URL** field, and click **Test Teams**.

---

## 4. Slack Setup 💬

### Step 1: Get Slack Webhook URL
1. Visit [Slack API: Incoming Webhooks](https://api.slack.com/messaging/webhooks).
2. Create a new **Slack App** and attach it to your Workspace.
3. Toggle **Incoming Webhooks** to **On**.
4. Click **Add New Webhook to Workspace**, select the target channel (e.g., `#deployments`), and click **Allow**.
5. Copy the generated **Webhook URL** (Starts with `https://hooks.slack.com/services/...`).

### Step 2: Apply Configuration
Open the **System Settings** page -> **Alerts & Notifications** tab, paste the URL into the **Slack Webhook URL** field, and click **Test Slack**.

---

🎉 **Done!**
All scheduling updates, AI imports, and environment modifications will now push directly to your team's chat applications with premium UI!
