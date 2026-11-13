CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "document" JSONB NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JobPosting_contentHash_key" ON "JobPosting"("contentHash");

CREATE INDEX "JobPosting_updatedAt_idx" ON "JobPosting"("updatedAt");
