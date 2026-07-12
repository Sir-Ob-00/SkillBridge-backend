-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('student', 'artisan', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING_PROFILE', 'PENDING_REVIEW', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'ACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'resolved', 'escalated');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'student',
    "phone" TEXT,
    "profileImageUrl" TEXT,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artisan_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT,
    "bio" TEXT,
    "pricingFrom" DECIMAL(10,2),
    "location" TEXT,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "applicationStatus" "ApplicationStatus" NOT NULL DEFAULT 'PENDING_PROFILE',
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "reviewNotes" TEXT,
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verification" TEXT DEFAULT 'unverified',

    CONSTRAINT "artisan_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artisan_verifications" (
    "id" TEXT NOT NULL,
    "artisanProfileId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "verificationImageUrl" TEXT NOT NULL,
    "status" "VerificationReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artisan_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artisan_portfolio" (
    "id" TEXT NOT NULL,
    "artisanProfileId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artisan_portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artisan_availability" (
    "id" TEXT NOT NULL,
    "artisanProfileId" TEXT NOT NULL,
    "day" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artisan_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artisan_skills" (
    "id" TEXT NOT NULL,
    "artisanProfileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artisan_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artisan_categories" (
    "id" TEXT NOT NULL,
    "artisanProfileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artisan_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artisan_services" (
    "id" TEXT NOT NULL,
    "artisanProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artisan_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_history" (
    "id" TEXT NOT NULL,
    "artisanProfileId" TEXT NOT NULL,
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus" NOT NULL,
    "changedByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_artisans" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_artisans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "serviceTitle" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "assignedTo" TEXT,
    "resolution" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "targetUserId" TEXT,
    "targetRole" "Role",
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "appName" TEXT NOT NULL DEFAULT 'SkillBridge',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@skillbridge.dev',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "allowNewRegistrations" BOOLEAN NOT NULL DEFAULT true,
    "bookingLeadTimeHours" INTEGER NOT NULL DEFAULT 24,
    "maxBookingsPerDay" INTEGER NOT NULL DEFAULT 5,
    "notifyOnNewReport" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnNewBooking" BOOLEAN NOT NULL DEFAULT true,
    "featuredArtisanIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "artisan_profiles_userId_key" ON "artisan_profiles"("userId");

-- CreateIndex
CREATE INDEX "artisan_profiles_applicationStatus_idx" ON "artisan_profiles"("applicationStatus");

-- CreateIndex
CREATE INDEX "artisan_profiles_verification_idx" ON "artisan_profiles"("verification");

-- CreateIndex
CREATE INDEX "artisan_profiles_userId_idx" ON "artisan_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "artisan_verifications_artisanProfileId_key" ON "artisan_verifications"("artisanProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "artisan_verifications_reviewedByUserId_key" ON "artisan_verifications"("reviewedByUserId");

-- CreateIndex
CREATE INDEX "artisan_verifications_artisanProfileId_idx" ON "artisan_verifications"("artisanProfileId");

-- CreateIndex
CREATE INDEX "artisan_portfolio_artisanProfileId_idx" ON "artisan_portfolio"("artisanProfileId");

-- CreateIndex
CREATE INDEX "artisan_availability_artisanProfileId_idx" ON "artisan_availability"("artisanProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "artisan_availability_artisanProfileId_day_key" ON "artisan_availability"("artisanProfileId", "day");

-- CreateIndex
CREATE INDEX "artisan_skills_artisanProfileId_idx" ON "artisan_skills"("artisanProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "artisan_skills_artisanProfileId_skillId_key" ON "artisan_skills"("artisanProfileId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "skills_categoryId_idx" ON "skills"("categoryId");

-- CreateIndex
CREATE INDEX "artisan_categories_artisanProfileId_idx" ON "artisan_categories"("artisanProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "artisan_categories_artisanProfileId_categoryId_key" ON "artisan_categories"("artisanProfileId", "categoryId");

-- CreateIndex
CREATE INDEX "artisan_services_artisanProfileId_idx" ON "artisan_services"("artisanProfileId");

-- CreateIndex
CREATE INDEX "artisan_services_categoryId_idx" ON "artisan_services"("categoryId");

-- CreateIndex
CREATE INDEX "application_status_history_artisanProfileId_idx" ON "application_status_history"("artisanProfileId");

-- CreateIndex
CREATE INDEX "application_status_history_createdAt_idx" ON "application_status_history"("createdAt");

-- CreateIndex
CREATE INDEX "application_status_history_toStatus_idx" ON "application_status_history"("toStatus");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE INDEX "saved_artisans_artisanId_idx" ON "saved_artisans"("artisanId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_artisans_studentId_artisanId_key" ON "saved_artisans"("studentId", "artisanId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "bookings_studentId_idx" ON "bookings"("studentId");

-- CreateIndex
CREATE INDEX "bookings_artisanId_idx" ON "bookings"("artisanId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_bookingId_key" ON "reviews"("bookingId");

-- CreateIndex
CREATE INDEX "reviews_artisanId_idx" ON "reviews"("artisanId");

-- CreateIndex
CREATE INDEX "reviews_studentId_idx" ON "reviews"("studentId");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_targetUserId_idx" ON "reports"("targetUserId");

-- CreateIndex
CREATE INDEX "messages_chatId_idx" ON "messages"("chatId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_receiverId_idx" ON "messages"("receiverId");

-- CreateIndex
CREATE INDEX "notifications_targetUserId_idx" ON "notifications"("targetUserId");

-- CreateIndex
CREATE INDEX "notifications_targetRole_idx" ON "notifications"("targetRole");

-- CreateIndex
CREATE INDEX "audit_logs_adminId_idx" ON "audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_profiles" ADD CONSTRAINT "artisan_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_profiles" ADD CONSTRAINT "artisan_profiles_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_verifications" ADD CONSTRAINT "artisan_verifications_artisanProfileId_fkey" FOREIGN KEY ("artisanProfileId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_verifications" ADD CONSTRAINT "artisan_verifications_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_portfolio" ADD CONSTRAINT "artisan_portfolio_artisanProfileId_fkey" FOREIGN KEY ("artisanProfileId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_availability" ADD CONSTRAINT "artisan_availability_artisanProfileId_fkey" FOREIGN KEY ("artisanProfileId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_skills" ADD CONSTRAINT "artisan_skills_artisanProfileId_fkey" FOREIGN KEY ("artisanProfileId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_skills" ADD CONSTRAINT "artisan_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_categories" ADD CONSTRAINT "artisan_categories_artisanProfileId_fkey" FOREIGN KEY ("artisanProfileId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_categories" ADD CONSTRAINT "artisan_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_services" ADD CONSTRAINT "artisan_services_artisanProfileId_fkey" FOREIGN KEY ("artisanProfileId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_services" ADD CONSTRAINT "artisan_services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_artisanProfileId_fkey" FOREIGN KEY ("artisanProfileId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_artisans" ADD CONSTRAINT "saved_artisans_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_artisans" ADD CONSTRAINT "saved_artisans_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
