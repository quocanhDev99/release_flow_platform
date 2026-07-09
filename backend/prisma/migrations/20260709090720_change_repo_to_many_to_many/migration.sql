-- DropForeignKey
ALTER TABLE "deployment_items" DROP CONSTRAINT "deployment_items_repositoryId_fkey";

-- CreateTable
CREATE TABLE "_DeploymentItemToRepository" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DeploymentItemToRepository_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DeploymentItemToRepository_B_index" ON "_DeploymentItemToRepository"("B");

-- AddForeignKey
ALTER TABLE "_DeploymentItemToRepository" ADD CONSTRAINT "_DeploymentItemToRepository_A_fkey" FOREIGN KEY ("A") REFERENCES "deployment_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeploymentItemToRepository" ADD CONSTRAINT "_DeploymentItemToRepository_B_fkey" FOREIGN KEY ("B") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copy existing relationship data to join table
INSERT INTO "_DeploymentItemToRepository" ("A", "B")
SELECT "id", "repositoryId" FROM "deployment_items" WHERE "repositoryId" IS NOT NULL;

-- AlterTable
ALTER TABLE "deployment_items" DROP COLUMN "repositoryId";
