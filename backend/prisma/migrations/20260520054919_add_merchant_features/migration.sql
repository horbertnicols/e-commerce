-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MERCHANT';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "merchantId" TEXT;

-- CreateTable
CREATE TABLE "merchant_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "businessLicense" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "status" "MerchantStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "merchant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchant_profiles_userId_key" ON "merchant_profiles"("userId");

-- CreateIndex
CREATE INDEX "merchant_profiles_status_idx" ON "merchant_profiles"("status");

-- CreateIndex
CREATE INDEX "products_merchantId_idx" ON "products"("merchantId");

-- AddForeignKey
ALTER TABLE "merchant_profiles" ADD CONSTRAINT "merchant_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
