-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Favorite_isPublic_idx" ON "Favorite"("isPublic");
