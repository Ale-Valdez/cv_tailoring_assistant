CREATE TABLE "TailoredCV" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "document" JSONB NOT NULL,

    CONSTRAINT "TailoredCV_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TailoredCV_profileId_jobPostingId_key" ON "TailoredCV"("profileId", "jobPostingId");

CREATE INDEX "TailoredCV_updatedAt_idx" ON "TailoredCV"("updatedAt");
