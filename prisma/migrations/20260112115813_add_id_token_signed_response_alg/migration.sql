/*
  Warnings:

  - You are about to drop the column `orgId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the `api_keys` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `org_domains` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `org_invites` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `org_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `org_sso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment_methods` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_organizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wallet_dispute_evidence` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wallet_disputes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wallet_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wallets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_userId_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_orgId_fkey";

-- DropForeignKey
ALTER TABLE "org_domains" DROP CONSTRAINT "org_domains_orgId_fkey";

-- DropForeignKey
ALTER TABLE "org_invites" DROP CONSTRAINT "org_invites_orgId_fkey";

-- DropForeignKey
ALTER TABLE "org_roles" DROP CONSTRAINT "org_roles_orgId_fkey";

-- DropForeignKey
ALTER TABLE "org_sso" DROP CONSTRAINT "org_sso_orgId_fkey";

-- DropForeignKey
ALTER TABLE "payment_methods" DROP CONSTRAINT "payment_methods_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_organizations" DROP CONSTRAINT "user_organizations_orgId_fkey";

-- DropForeignKey
ALTER TABLE "user_organizations" DROP CONSTRAINT "user_organizations_userId_fkey";

-- DropForeignKey
ALTER TABLE "wallet_dispute_evidence" DROP CONSTRAINT "wallet_dispute_evidence_disputeId_fkey";

-- DropForeignKey
ALTER TABLE "wallet_disputes" DROP CONSTRAINT "wallet_disputes_txnId_fkey";

-- DropForeignKey
ALTER TABLE "wallet_disputes" DROP CONSTRAINT "wallet_disputes_walletId_fkey";

-- DropForeignKey
ALTER TABLE "wallet_transactions" DROP CONSTRAINT "wallet_transactions_walletId_fkey";

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_orgId_fkey";

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_userId_fkey";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "orgId";

-- AlterTable
ALTER TABLE "oauth_clients" ADD COLUMN     "id_token_signed_response_alg" TEXT NOT NULL DEFAULT 'RS256';

-- DropTable
DROP TABLE "api_keys";

-- DropTable
DROP TABLE "org_domains";

-- DropTable
DROP TABLE "org_invites";

-- DropTable
DROP TABLE "org_roles";

-- DropTable
DROP TABLE "org_sso";

-- DropTable
DROP TABLE "organizations";

-- DropTable
DROP TABLE "payment_methods";

-- DropTable
DROP TABLE "user_organizations";

-- DropTable
DROP TABLE "wallet_dispute_evidence";

-- DropTable
DROP TABLE "wallet_disputes";

-- DropTable
DROP TABLE "wallet_transactions";

-- DropTable
DROP TABLE "wallets";

-- CreateTable
CREATE TABLE "OidcPayload" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "grantId" TEXT,
    "userCode" TEXT,
    "uid" TEXT,
    "expiresAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OidcPayload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OidcPayload_uid_key" ON "OidcPayload"("uid");

-- CreateIndex
CREATE INDEX "OidcPayload_type_idx" ON "OidcPayload"("type");

-- CreateIndex
CREATE INDEX "OidcPayload_grantId_idx" ON "OidcPayload"("grantId");
