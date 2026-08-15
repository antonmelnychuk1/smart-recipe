CREATE TABLE "RecipeFeedback" (
    "id" TEXT NOT NULL,
    "recipeKey" TEXT NOT NULL,
    "recipeTitle" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "recipe" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RecipeFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecipeFeedback_userId_recipeKey_key" ON "RecipeFeedback"("userId", "recipeKey");

CREATE INDEX "RecipeFeedback_userId_updatedAt_idx" ON "RecipeFeedback"("userId", "updatedAt");

CREATE INDEX "RecipeFeedback_feedback_idx" ON "RecipeFeedback"("feedback");

ALTER TABLE "RecipeFeedback" ADD CONSTRAINT "RecipeFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
