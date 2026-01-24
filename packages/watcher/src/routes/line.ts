import type {
  MessageEvent,
  WebhookEvent,
  WebhookRequestBody,
} from '@line/bot-sdk'
import {
  LINE_SIGNATURE_HTTP_HEADER_NAME,
  validateSignature,
} from '@line/bot-sdk'
import { extractSaleIdFromUrl, getSale } from '@weverse-shop/core'
import { env } from 'cloudflare:workers'
import { Context, Hono } from 'hono'
import { line } from '../apis/line'
import { Commands } from '../constants/commands'
import { isProductStored, upsertProduct } from '../data/products'
import {
  deleteSubscription,
  getSubscription,
  getSubscriptionsByUserId,
  upsertSubscription,
} from '../data/subscriptions'
import { User } from '../data/types'
import { getUser } from '../data/users'
import { isVariantStored, upsertVariantsFromSale } from '../data/variants'
import { card } from '../lib/line/ui/card'

export type LineBotRoute = { Variables: { user: User } }

const lineBotRoute = new Hono<LineBotRoute>()

// Validate LINE request signature,
// see https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/
lineBotRoute.use('*', async (c, next) => {
  if (!env.LINE_BOT_SECRET) {
    throw new Error('Line bot secret not defined.')
  }

  const secret = env.LINE_BOT_SECRET
  const sig = c.req.header(LINE_SIGNATURE_HTTP_HEADER_NAME)

  if (!sig) {
    throw new Error('No sigature in headers.')
  }

  const body = await c.req.text()
  const validation = validateSignature(body, secret, sig)

  if (!validation) {
    throw new Error('Validation failed.')
  }

  await next()
})

async function handleLineMessage(
  c: Context<LineBotRoute>,
  event: MessageEvent,
) {
  if (event.message.type !== 'text') {
    // Only handle text message
    return null
  }

  const user = c.get('user')

  const { replyToken } = event
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

    return await line.replyMessage({
      replyToken,
      messages: [
        card({
          alt: '商品查詢結果',
          imageUrl: sale.thumbnailImageUrls[0],
          title: '【商品查詢結果】',
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
      ],
    })
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

    return line.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: '已完成訂閱' }],
    })
  }

  if (text.startsWith(Commands.ListSubscription)) {
    const subscriptions = await getSubscriptionsByUserId({ userId: user.id })

    if (subscriptions.length === 0) {
      return line.replyMessage({
        replyToken,
        messages: [{ type: 'text', text: '現在還沒有訂閱哦，開始新增吧！' }],
      })
    }

    return line.replyMessage({
      replyToken,
      messages: [
        card({
          title: '現有訂閱',
          description: '以下是你現在有訂閱的品項，點擊即可刪除',
          imageUrl: 'https://picsum.photos/200/300', // TODO: Replace placeholder image
          actions: subscriptions.map((sub) => ({
            label: sub.variant?.variantName ?? '無品名', // TODO: Fix type and include product only subscription name
            message: `${Commands.DeleteSubscription} ${sub.id}`,
          })),
        }),
      ],
    })
  }

  if (text.startsWith(Commands.DeleteSubscription)) {
    const id = Number(text.replace(Commands.DeleteSubscription, '').trim())

    const subscription = await getSubscription({ id })

    if (!subscription) {
      return line.replyMessage({
        replyToken,
        messages: [
          {
            type: 'text',
            text: '訂閱不存在',
          },
        ],
      })
    }

    if (user.id != subscription?.userId) {
      return line.replyMessage({
        replyToken,
        messages: [
          {
            type: 'text',
            text: '無法刪除此訂閱（這不是你的）',
          },
        ],
      })
    }

    const deletedSubscription = await deleteSubscription({ id })

    if (deletedSubscription) {
      return line.replyMessage({
        replyToken,
        messages: [
          {
            type: 'text',
            text: '刪除成功',
          },
        ],
      })
    }
  }

  return line.replyMessage({
    replyToken,
    messages: [
      {
        type: 'text',
        text: `哈囉，請輸入以下指令來跟機器人互動
- ${Commands.Track} {Weverse Shop 連結}：開始選擇訂閱機制
- ${Commands.ListSubscription}：列出已訂閱的商品通知`,
      },
    ],
  })
}

async function handleLineEvent(c: Context<LineBotRoute>, event: WebhookEvent) {
  const {
    source: { userId: lineUserId },
    type,
  } = event

  if (!lineUserId) {
    return null
  }

  await line.showLoadingAnimation({
    chatId: lineUserId,
  })

  const user = await getUser({ lineUserId })
  c.set('user', user)

  switch (type) {
    case 'message':
      return handleLineMessage(c, event)
    default:
      return null
  }
}

lineBotRoute.post('/message', async (c) => {
  const body: WebhookRequestBody = await c.req.json()

  return Promise.all(body.events.map((event) => handleLineEvent(c, event)))
    .then((result) => c.json(result))
    .catch((e: Error) => {
      console.error(e)
    })
})

export { lineBotRoute }
