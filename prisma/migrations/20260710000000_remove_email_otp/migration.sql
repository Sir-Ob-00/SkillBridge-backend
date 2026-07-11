-- AlterEnum
BEGIN;
CREATE TYPE "ApplicationStatus_new" AS ENUM ('PENDING_PROFILE', 'PENDING_REVIEW', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'ACTIVE', 'REJECTED');
ALTER TABLE "public"."artisan_profiles" ALTER COLUMN "applicationStatus" DROP DEFAULT;
ALTER TABLE "artisan_profiles" ALTER COLUMN "applicationStatus" TYPE "ApplicationStatus_new" USING ("applicationStatus"::text::"ApplicationStatus_new");
ALTER TABLE "application_status_history" ALTER COLUMN "fromStatus" TYPE "ApplicationStatus_new" USING ("fromStatus"::text::"ApplicationStatus_new");
ALTER TABLE "application_status_history" ALTER COLUMN "toStatus" TYPE "ApplicationStatus_new" USING ("toStatus"::text::"ApplicationStatus_new");
ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
DROP TYPE "public"."ApplicationStatus_old";
ALTER TABLE "artisan_profiles" ALTER COLUMN "applicationStatus" SET DEFAULT 'PENDING_PROFILE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "VerificationReviewStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED');
ALTER TABLE "public"."artisan_verifications" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "artisan_verifications" ALTER COLUMN "status" TYPE "VerificationReviewStatus_new" USING ("status"::text::"VerificationReviewStatus_new");
ALTER TYPE "VerificationReviewStatus" RENAME TO "VerificationReviewStatus_old";
ALTER TYPE "VerificationReviewStatus_new" RENAME TO "VerificationReviewStatus";
DROP TYPE "public"."VerificationReviewStatus_old";
ALTER TABLE "artisan_verifications" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "email_verification_otps" DROP CONSTRAINT "email_verification_otps_userId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailVerified";

-- DropTable
DROP TABLE "email_verification_otps";
