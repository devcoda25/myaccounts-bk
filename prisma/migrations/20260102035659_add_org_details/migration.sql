-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "country" TEXT,
ADD COLUMN     "walletEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user_organizations" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "monthlyLimit" DECIMAL(15,2) NOT NULL DEFAULT 0.00;
