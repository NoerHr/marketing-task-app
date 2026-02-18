-- AlterTable
ALTER TABLE "User" ALTER COLUMN "notificationPreferences" SET DEFAULT '{"taskAssignment":true,"approval":true,"revision":true,"reassignment":true,"deadlineAlert":true}';
