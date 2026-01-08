/*
  Warnings:

  - You are about to drop the column `documentsRegex` on the `kyc_records` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('SUPER_APP_ADMIN', 'REGIONAL_ADMIN', 'STAFF');

-- AlterTable
ALTER TABLE "kyc_records" DROP COLUMN "documentsRegex",
ADD COLUMN     "docType" TEXT,
ADD COLUMN     "documents" JSONB,
ADD COLUMN     "riskScore" TEXT NOT NULL DEFAULT 'Low';

-- AlterTable
ALTER TABLE "oauth_clients" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "org_domains" ADD COLUMN     "allowPasswordFallback" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultRole" TEXT NOT NULL DEFAULT 'Member',
ADD COLUMN     "requireSso" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "passkeyChallenge" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferences" JSONB,
ADD COLUMN     "recoveryCodes" TEXT[];

-- AlterTable
ALTER TABLE "verification_requests" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_contacts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "capabilities" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "user_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB,
    "orgId" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "role" "AppRole" NOT NULL,
    "region" TEXT,
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'Active',
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_disputes" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "txnId" TEXT,
    "reference" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_dispute_evidence" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_dispute_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parental_child_profiles" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "school" TEXT,
    "grade" TEXT,
    "country" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "guardianVerified" BOOLEAN NOT NULL DEFAULT false,
    "consentVersion" TEXT,
    "consentAt" TIMESTAMP(3),
    "template" TEXT NOT NULL DEFAULT 'Custom',
    "guardianRelationship" TEXT NOT NULL DEFAULT 'Parent',
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "dailyLimit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "weeklyLimit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "requireApprovalAbove" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "requireApprovalForAllPurchases" BOOLEAN NOT NULL DEFAULT true,
    "allowWithdrawals" BOOLEAN NOT NULL DEFAULT false,
    "allowPeerTransfers" BOOLEAN NOT NULL DEFAULT false,
    "allowSavedCards" BOOLEAN NOT NULL DEFAULT false,
    "categoryBlocks" TEXT[],
    "sellerWhitelist" TEXT[],
    "allowTeacherMentorChat" BOOLEAN NOT NULL DEFAULT true,
    "allowAttachments" BOOLEAN NOT NULL DEFAULT false,
    "allowVoiceCalls" BOOLEAN NOT NULL DEFAULT false,
    "allowUnknownContacts" BOOLEAN NOT NULL DEFAULT false,
    "guardianChannels" JSONB,
    "preset" TEXT NOT NULL DEFAULT 'Custom',
    "bedtimeLock" BOOLEAN NOT NULL DEFAULT true,
    "dailyWindowStart" TEXT,
    "dailyWindowEnd" TEXT,
    "curfewEnabled" BOOLEAN NOT NULL DEFAULT false,
    "curfewStart" TEXT,
    "curfewEnd" TEXT,
    "curfewHardLock" BOOLEAN NOT NULL DEFAULT true,
    "curfewAllowSchool" BOOLEAN NOT NULL DEFAULT true,
    "geofencesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "geofencesAlerts" BOOLEAN NOT NULL DEFAULT true,
    "homeAddress" TEXT,
    "homeRadius" DOUBLE PRECISION,
    "schoolAddress" TEXT,
    "schoolRadius" DOUBLE PRECISION,
    "apps" JSONB,
    "chargingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dailyKwhCap" DOUBLE PRECISION,
    "sessionKwhCap" DOUBLE PRECISION,
    "reqApprovalAboveKwh" DOUBLE PRECISION,
    "allowedStations" TEXT[],
    "locationSharing" BOOLEAN NOT NULL DEFAULT false,
    "publicProfile" BOOLEAN NOT NULL DEFAULT false,
    "marketingOptOut" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parental_child_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parental_households" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT,
    "approvalMode" TEXT NOT NULL DEFAULT 'Any guardian',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parental_households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parental_household_members" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "channels" JSONB,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parental_household_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parental_approvals" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(15,2),
    "currency" TEXT,
    "app" TEXT NOT NULL,
    "vendor" TEXT,
    "kind" TEXT NOT NULL,
    "reason" TEXT,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parental_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parental_activities" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parental_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_roles_orgId_name_key" ON "org_roles"("orgId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "app_memberships_userId_clientId_key" ON "app_memberships"("userId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "parental_households_ownerId_key" ON "parental_households"("ownerId");

-- AddForeignKey
ALTER TABLE "user_contacts" ADD CONSTRAINT "user_contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_roles" ADD CONSTRAINT "org_roles_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_clients" ADD CONSTRAINT "oauth_clients_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_memberships" ADD CONSTRAINT "app_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_memberships" ADD CONSTRAINT "app_memberships_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_disputes" ADD CONSTRAINT "wallet_disputes_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_disputes" ADD CONSTRAINT "wallet_disputes_txnId_fkey" FOREIGN KEY ("txnId") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_dispute_evidence" ADD CONSTRAINT "wallet_dispute_evidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "wallet_disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parental_child_profiles" ADD CONSTRAINT "parental_child_profiles_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parental_households" ADD CONSTRAINT "parental_households_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parental_household_members" ADD CONSTRAINT "parental_household_members_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "parental_households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parental_household_members" ADD CONSTRAINT "parental_household_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parental_approvals" ADD CONSTRAINT "parental_approvals_childId_fkey" FOREIGN KEY ("childId") REFERENCES "parental_child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parental_activities" ADD CONSTRAINT "parental_activities_childId_fkey" FOREIGN KEY ("childId") REFERENCES "parental_child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
