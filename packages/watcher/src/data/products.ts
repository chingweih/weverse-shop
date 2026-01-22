import { SaleData } from '@weverse-shop/core'
import { db } from '../db'
import { productsTable } from '../db/schema'
import { count, eq } from 'drizzle-orm'

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
      target: productsTable.saleId,
      set: { lastCheckedAt: new Date() },
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
