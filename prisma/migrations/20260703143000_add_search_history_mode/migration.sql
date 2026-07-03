-- AlterTable
ALTER TABLE "SearchHistory"
ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'ingredients',
ADD COLUMN "query" TEXT;
