import { eq } from 'drizzle-orm'
import { db } from '../db'
import { subscriptionsTable } from '../db/schema'
import { getProductBySaleId } from './products'
import { getVariantByStockId } from './variants'

export async function getSubscriptionsByUserId({ userId }: { userId: number }) {
  return await db.query.subscriptionsTable.findMany({
    with: {
      variant: true,
    },
    where: eq(subscriptionsTable.userId, userId),
  })
}

export async function getSubscription({ id }: { id: number }) {
  return await db.query.subscriptionsTable.findFirst({
    where: eq(subscriptionsTable.id, id),
  })
}

export async function deleteSubscription({ id }: { id: number }) {
  const [deletedSubscription] = await db
    .delete(subscriptionsTable)
    .where(eq(subscriptionsTable.id, id))
    .returning()

  return deletedSubscription
}

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
      target: subscriptionsTable.uniquenessKey,
      set: { userId },
    })
    .returning()

  return subscription
}
