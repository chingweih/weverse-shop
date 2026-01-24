import type { Context } from 'hono'
import type { LineBotRoute } from '../../../routes/line'
import type { MessageEvent } from '@line/bot-sdk'
import { Commands } from '../../../constants/commands'
import { extractSaleIdFromUrl, getSale } from '@weverse-shop/core'
import { isProductStored, upsertProduct } from '../../../data/products'
import { isVariantStored, upsertVariantsFromSale } from '../../../data/variants'
import { card } from '../ui/card'
import { reply } from '../utils/reply'
import {
  deleteSubscription,
  getSubscription,
  getSubscriptionsByUserId,
  upsertSubscription,
} from '../../../data/subscriptions'

export async function handleLineMessage(
  c: Context<LineBotRoute>,
  event: MessageEvent,
) {
  if (event.message.type !== 'text') {
    // Only handle text message
    return null
  }

  const user = c.get('user')

  const { text } = event.message

  if (text.startsWith(Commands.Track)) {
    const url = text.replace(Commands.Track, '').trim()
    const saleId = extractSaleIdFromUrl(url)

    if (!saleId) {
      return null
    }

    const sale = await getSale(saleId)

    const product = await upsertProduct({ sale })
    const updatedVariants = await upsertVariantsFromSale({ sale, product })

    return await reply(
      c,
      card({
        imageUrl: sale.thumbnailImageUrls[0],
        title: '商品查詢結果',
        description: `以下是 ${sale.name} 的所有品項，請選擇想要訂閱的品項，或是訂閱任一品項`,
        actions: [
          ...sale.option.options.map((option) => ({
            label: option.saleOptionName,
            message: `${Commands.Subscribe} ${saleId} ${option.saleStockId}`,
          })),
          {
            label: '訂閱任一品項',
            message: `${Commands.Subscribe} ${saleId}`,
          },
        ],
      }),
    )
  }

  if (text.startsWith(Commands.Subscribe)) {
    const [saleId, variantStockId] = text
      .replace(Commands.Subscribe, '')
      .trim()
      .split(' ')

    if (!saleId) {
      return null
    }

    if (!isProductStored({ saleId })) {
      return null
    }

    if (variantStockId && !isVariantStored({ variantStockId })) {
      return null
    }

    const subscription = await upsertSubscription({
      userId: user.id,
      saleId,
      variantStockId,
    })

    return await reply(c, '已完成訂閱')
  }

  if (text.startsWith(Commands.ListSubscription)) {
    const subscriptions = await getSubscriptionsByUserId({ userId: user.id })

    if (subscriptions.length === 0) {
      return await reply(c, '現在還沒有訂閱哦，開始新增吧！')
    }

    return await reply(
      c,
      card({
        title: '現有訂閱',
        description: '以下是你現在有訂閱的品項，點擊即可刪除',
        imageUrl: 'https://picsum.photos/200/300', // TODO: Replace placeholder image
        actions: subscriptions.map((sub) => ({
          label: sub.variant?.variantName ?? '無品名', // TODO: Fix type and include product only subscription name
          message: `${Commands.DeleteSubscription} ${sub.id}`,
        })),
      }),
    )
  }

  if (text.startsWith(Commands.DeleteSubscription)) {
    const id = Number(text.replace(Commands.DeleteSubscription, '').trim())

    const subscription = await getSubscription({ id })

    if (!subscription) {
      return await reply(c, '訂閱不存在')
    }

    if (user.id != subscription?.userId) {
      return await reply(c, '無法刪除此訂閱（這不是你的）')
    }

    const deletedSubscription = await deleteSubscription({ id })

    if (deletedSubscription) {
      return await reply(c, '刪除成功')
    }
  }

  return await reply(
    c,
    `哈囉，請輸入以下指令來跟機器人互動
- ${Commands.Track} {Weverse Shop 連結}：開始選擇訂閱機制
- ${Commands.ListSubscription}：列出已訂閱的商品通知`,
  )
}
