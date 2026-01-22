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
import { upsertSubscription } from '../data/subscriptions'
import { User } from '../data/types'
import { getUser } from '../data/users'
import { isVariantStored, upsertVariantsFromSale } from '../data/variants'
import { card } from '../lib/line/ui/card'

export type LineBotRoute = { Variables: { user: User } }

const lineBotRoute = new Hono<LineBotRoute>()

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
              message: `/訂閱 ${saleId} ${option.saleStockId}`,
            })),
            {
              label: '訂閱任一品項',
              message: `/訂閱 ${saleId}`,
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

    const insertedSubscription = await upsertSubscription({
      userId: user.id,
      saleId,
      variantStockId,
    })

    if (!insertedSubscription) {
      return line.replyMessage({
        replyToken,
        messages: [{ type: 'text', text: '[ERROR] 無法新增，可能已經新增過' }],
      })
    }

    return line.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: '已完成訂閱' }],
    })
  }

  return null
}

async function handleLineEvent(c: Context<LineBotRoute>, event: WebhookEvent) {
  const {
    source: { userId: lineUserId },
    type,
  } = event

  if (!lineUserId) {
    return null
  }

  line.showLoadingAnimation({
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
