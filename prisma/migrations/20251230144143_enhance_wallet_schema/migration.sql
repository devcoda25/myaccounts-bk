/*
  Warnings:

  - Added the required column `updatedAt` to the `wallet_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "wallet_transactions" ADD COLUMN     "channel" TEXT DEFAULT 'Wallet',
ADD COLUMN     "counterparty" TEXT,
ADD COLUMN     "providerRef" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
