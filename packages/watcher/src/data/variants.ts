import { SaleData, SalesStatus } from '@weverse-shop/core'
import { db } from '../db'
import { variantsTable } from '../db/schema'
import { Product } from './types'
import { eq } from 'drizzle-orm'

export async function getVariantByStockId({
  variantStockId,
}: {
  variantStockId: string
}) {
  return await db.query.variantsTable.findFirst({
    where: eq(variantsTable.variantStockId, variantStockId),
  })
}

export async function upsertVariantsFromSale({
  sale,
  product,
}: {
  sale: SaleData
  product: Product
}) {
  const variants = await db
    .insert(variantsTable)
    .values(
      sale.option.options.map((option) => ({
        productId: product.id,
        variantName: option.saleOptionName,
        variantStockId: option.saleStockId.toString(),
        lastStatus: option.isSoldOut
          ? SalesStatus.SoldOut
          : SalesStatus.InStock,
      })),
    )
    .onConflictDoNothing()
    .returning()

  return variants
}

export async function isVariantStored({
  variantStockId,
}: {
  variantStockId: string
}) {
  const variants = await db
    .select()
    .from(variantsTable)
    .where(eq(variantsTable.variantStockId, variantStockId))
    .limit(1)

  return variants.length > 0
}
