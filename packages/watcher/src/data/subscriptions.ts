import { db } from '../db'
import { subscriptionsTable } from '../db/schema'
import { getProductBySaleId } from './products'
import { getVariantByStockId } from './variants'

export async function upsertSubscription({
  userId,
  saleId,
  variantStockId,
}: {
  userId: number
  saleId: string
  variantStockId?: string
}) {
  const product = await getProductBySaleId({ saleId })
  const variant = await getVariantByStockId({
    variantStockId: variantStockId ?? '-1',
  })

  if (!product) {
    return null
  }

  const [subscription] = await db
    .insert(subscriptionsTable)
    .values({
      userId,
      productId: product.id,
      variantId: variant?.id,
    })
    .onConflictDoUpdate({
      target: [
        subscriptionsTable.userId,
        subscriptionsTable.productId,
        subscriptionsTable.variantId,
      ],
      set: { userId, productId: product.id, variantId: variant?.id },
    })
    .returning()

  return subscription
}
