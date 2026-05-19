-- DropIndex
DROP INDEX "cart_items_userId_productId_key";

-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "selectedSpecs" JSONB;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "selectedSpecs" JSONB;

-- CreateIndex
CREATE INDEX "cart_items_userId_productId_idx" ON "cart_items"("userId", "productId");
