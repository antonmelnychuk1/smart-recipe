-- CreateTable
CREATE TABLE "GenerationUsage" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GenerationUsage_windowStart_idx" ON "GenerationUsage"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "GenerationUsage_identifier_windowStart_key" ON "GenerationUsage"("identifier", "windowStart");
