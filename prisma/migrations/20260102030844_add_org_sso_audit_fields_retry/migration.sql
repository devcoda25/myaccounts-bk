-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "actorName" TEXT,
ADD COLUMN     "severity" TEXT NOT NULL DEFAULT 'info';

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "ssoDomains" TEXT[],
ADD COLUMN     "ssoEnabled" BOOLEAN NOT NULL DEFAULT false;
