import { SaleData } from '@weverse-shop/core'
import { eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { productsTable } from '../db/schema'

export async function getProductBySaleId({ saleId }: { saleId: string }) {
  return await db.query.productsTable.findFirst({
    where: eq(productsTable.saleId, saleId),
  })
}

export async function upsertProduct({ sale }: { sale: SaleData }) {
  const saleId = sale.saleId.toString()
  const [product] = await db
    .insert(productsTable)
    .values({
      saleId,
      lastCheckedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [productsTable.type, productsTable.saleId],
      set: { lastCheckedAt: sql`CURRENT_TIMESTAMP` },
    })
    .returning()

  return product
}

export async function isProductStored({ saleId }: { saleId: string }) {
  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.saleId, saleId))
    .limit(1)

  return products.length > 0
}
