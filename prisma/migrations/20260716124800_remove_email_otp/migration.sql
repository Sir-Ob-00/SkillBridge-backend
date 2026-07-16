-- Drop the OTP table (cascade removes the FK from email_verification_otps -> users)
DROP TABLE "email_verification_otps";

-- Remove the email verification flag from users
ALTER TABLE "users" DROP COLUMN "emailVerified";
