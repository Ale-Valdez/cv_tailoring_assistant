CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "document" JSONB NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Profile_updatedAt_idx" ON "Profile"("updatedAt");
