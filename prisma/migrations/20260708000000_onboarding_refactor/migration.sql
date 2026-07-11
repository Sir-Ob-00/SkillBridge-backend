-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('EMAIL_VERIFICATION_PENDING', 'PENDING_PROFILE', 'PENDING_REVIEW', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'ACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

-- DropForeignKey
ALTER TABLE "portfolio_items" DROP CONSTRAINT "portfolio_items_artisanId_fkey";

-- DropForeignKey
ALTER TABLE "services" DROP CONSTRAINT "services_artisanId_fkey";

-- DropIndex
DROP INDEX "artisan_profiles_categories_idx";

-- DropIndex
DROP INDEX "artisan_profiles_verification_idx";

-- AlterTable
ALTER TABLE "artisan_profiles" DROP COLUMN "availability",
DROP COLUMN "categories",
DROP COLUMN "skills",
DROP COLUMN "verification",
ADD COLUMN     "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING_PROFILE';

-- DropTable
DROP TABLE "portfolio_items";

-- DropTable
DROP TABLE "services";

-- DropEnum
DROP TYPE "VerificationStatus";

-- CreateTable
CREATE TABLE "artisan_skills" (
    "id" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "artisan_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artisan_categories" (
    "id" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "artisan_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artisan_services" (
    "id" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artisan_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artisan_portfolio" (
    "id" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artisan_portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artisan_availability" (
    "id" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "artisan_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artisan_verifications" (
    "id" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "studentIdNumber" TEXT NOT NULL,
    "verificationImageUrl" TEXT NOT NULL,
    "reviewStatus" "VerificationReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artisan_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_history" (
    "id" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "note" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "artisan_skills_name_idx" ON "artisan_skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "artisan_skills_artisanId_name_key" ON "artisan_skills"("artisanId", "name");

-- CreateIndex
CREATE INDEX "artisan_categories_name_idx" ON "artisan_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "artisan_categories_artisanId_name_key" ON "artisan_categories"("artisanId", "name");

-- CreateIndex
CREATE INDEX "artisan_services_artisanId_idx" ON "artisan_services"("artisanId");

-- CreateIndex
CREATE INDEX "artisan_portfolio_artisanId_idx" ON "artisan_portfolio"("artisanId");

-- CreateIndex
CREATE INDEX "artisan_availability_artisanId_idx" ON "artisan_availability"("artisanId");

-- CreateIndex
CREATE UNIQUE INDEX "artisan_verifications_artisanId_key" ON "artisan_verifications"("artisanId");

-- CreateIndex
CREATE INDEX "application_status_history_artisanId_idx" ON "application_status_history"("artisanId");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "artisan_profiles_status_idx" ON "artisan_profiles"("status");

-- AddForeignKey
ALTER TABLE "artisan_skills" ADD CONSTRAINT "artisan_skills_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_categories" ADD CONSTRAINT "artisan_categories_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_services" ADD CONSTRAINT "artisan_services_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_portfolio" ADD CONSTRAINT "artisan_portfolio_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_availability" ADD CONSTRAINT "artisan_availability_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_verifications" ADD CONSTRAINT "artisan_verifications_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

