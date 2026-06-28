-- CreateTable
CREATE TABLE "PantryItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PantryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PantryItem_userId_label_key" ON "PantryItem"("userId", "label");

-- CreateIndex
CREATE INDEX "PantryItem_userId_expiresAt_idx" ON "PantryItem"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
