/*
  Warnings:

  - You are about to drop the column `releaseStreamId` on the `deployment_items` table. All the data in the column will be lost.
  - You are about to drop the column `deploymentItemId` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the `release_streams` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "deployment_items" DROP CONSTRAINT "deployment_items_releaseStreamId_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_deploymentItemId_fkey";

-- AlterTable
ALTER TABLE "deployment_items" DROP COLUMN "releaseStreamId",
ADD COLUMN     "releasePackageId" INTEGER;

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "deploymentItemId";

-- DropTable
DROP TABLE "release_streams";

-- CreateTable
CREATE TABLE "release_packages" (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL,
    "buildArtifactHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "release_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_policies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cronSchedule" TEXT NOT NULL,
    "targetEnvironment" TEXT NOT NULL,
    "capacityLimit" INTEGER NOT NULL DEFAULT 20,
    "freezeWindow" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_windows" (
    "id" SERIAL NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "freezeTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "policyId" INTEGER,
    "environmentId" INTEGER NOT NULL,

    CONSTRAINT "deployment_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_bookings" (
    "id" SERIAL NOT NULL,
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "releasePackageId" INTEGER NOT NULL,
    "deploymentWindowId" INTEGER NOT NULL,

    CONSTRAINT "deployment_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DeploymentItemToTicket" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DeploymentItemToTicket_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "release_packages_version_key" ON "release_packages"("version");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_policies_name_key" ON "deployment_policies"("name");

-- CreateIndex
CREATE INDEX "_DeploymentItemToTicket_B_index" ON "_DeploymentItemToTicket"("B");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "deployment_items" ADD CONSTRAINT "deployment_items_releasePackageId_fkey" FOREIGN KEY ("releasePackageId") REFERENCES "release_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_windows" ADD CONSTRAINT "deployment_windows_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "deployment_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_windows" ADD CONSTRAINT "deployment_windows_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_bookings" ADD CONSTRAINT "deployment_bookings_releasePackageId_fkey" FOREIGN KEY ("releasePackageId") REFERENCES "release_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_bookings" ADD CONSTRAINT "deployment_bookings_deploymentWindowId_fkey" FOREIGN KEY ("deploymentWindowId") REFERENCES "deployment_windows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeploymentItemToTicket" ADD CONSTRAINT "_DeploymentItemToTicket_A_fkey" FOREIGN KEY ("A") REFERENCES "deployment_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeploymentItemToTicket" ADD CONSTRAINT "_DeploymentItemToTicket_B_fkey" FOREIGN KEY ("B") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
