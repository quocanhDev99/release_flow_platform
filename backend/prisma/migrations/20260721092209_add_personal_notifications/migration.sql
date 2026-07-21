-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notifyViaEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slackWebhookUrl" TEXT,
ADD COLUMN     "teamsWebhookUrl" TEXT,
ADD COLUMN     "telegramChatId" TEXT;
