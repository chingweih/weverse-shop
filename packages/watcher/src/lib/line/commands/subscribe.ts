import { err, ok, ResultAsync } from 'neverthrow'
import { createTextCommand } from '.'
import { Commands } from '../../../constants/commands'
import { isProductStored } from '../../../data/products'
import { upsertSubscription } from '../../../data/subscriptions'
import { isVariantStored } from '../../../data/variants'
import { reply } from '../utils/reply'
import { AuthenticationError, DatabaseError, InvalidInputError } from './errors'

class ProductNotFoundError extends Error {
  readonly name = 'ProductNotFoundError' as const
  constructor(saleId: string) {
    super(`Product not found: ${saleId}`)
  }
}

class VariantNotFoundError extends Error {
  readonly name = 'VariantNotFoundError' as const
  constructor(variantStockId: string) {
    super(`Variant not found: ${variantStockId}`)
  }
}

export const handleSubscribeCommand = createTextCommand<
  | AuthenticationError
  | InvalidInputError
  | ProductNotFoundError
  | VariantNotFoundError
  | DatabaseError
>({
  handler: async (c, message) => {
    const user = c.get('user')

    if (!user) {
      return err(new AuthenticationError('user not found'))
    }

    const [saleId, variantStockId] = message.text
      .replace(Commands.Subscribe, '')
      .trim()
      .split(' ')

    if (!saleId) {
      return err(new InvalidInputError(message.text))
    }

    const productIsStored = await isProductStored({ saleId })
    if (!productIsStored) {
      return err(new ProductNotFoundError(saleId.toString()))
    }

    const variantIsStored = await isVariantStored({ variantStockId })
    if (variantStockId && !variantIsStored) {
      return err(new VariantNotFoundError(variantStockId))
    }

    const upsertSubscriptionResult = await ResultAsync.fromPromise(
      upsertSubscription({
        userId: user.id,
        saleId,
        variantStockId,
      }),
      (error) =>
        new DatabaseError('upsert subscription', (error as Error).cause),
    )

    if (upsertSubscriptionResult.isErr()) {
      return err(upsertSubscriptionResult.error)
    }

    return ok(await reply(c, '已完成訂閱'))
  },
  onError: {
    AuthenticationError: '未登入',
    DatabaseError: '資料庫錯誤',
    InvalidInputError: '請檢查指令輸入是否有誤',
    ProductNotFoundError: `找不到商品，請輸入「${Commands.Track}」重新開始選擇商品`,
    VariantNotFoundError: `找不到品項，請輸入「${Commands.Track}」重新開始選擇商品`,
  },
})
