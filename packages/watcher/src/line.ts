import {
  validateSignature,
  LINE_SIGNATURE_HTTP_HEADER_NAME,
} from '@line/bot-sdk'
import type { WebhookRequestBody, WebhookEvent } from '@line/bot-sdk'
import { messagingApi } from '@line/bot-sdk'
import { extractSaleIdFromUrl, getSale, SalesStatus } from '@weverse-shop/core'
import { env } from 'cloudflare:workers'
import { Hono } from 'hono'

const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: env.LINE_BOT_ACCESS_TOKEN,
})

const lineBot = new Hono()

lineBot.use('*', async (c, next) => {
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

async function handleLineEvent(event: WebhookEvent) {
  try {
    switch (event.type) {
      case 'message':
        if (event.message.type !== 'text') {
          return null
        }

        const {
          message: { text },
        } = event

        const saleId = extractSaleIdFromUrl(text)

        if (!saleId) {
          return lineClient.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: 'text',
                text: '[ERROR] 無法處理此連結',
              },
            ],
          })
        }

        const sales = await getSale(saleId, {
          currency: 'KRW',
          locale: 'zh-tw',
        })

        return lineClient.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: 'text',
              text: `【商品查詢結果】

${sales.name} 目前「${sales.status !== SalesStatus.SoldOut ? '有貨' : '缺貨'}」
款式：${sales.option.options
                .filter((option) => !option.isSoldOut)
                .map((option) => option.saleOptionName)
                .join('、')}

手刀下單｜https://shop.weverse.io/zh-tw/shop/KRW/sales/${saleId}`,
            },
            {
              type: 'image',
              originalContentUrl: sales.thumbnailImageUrls[0],
              previewImageUrl: sales.thumbnailImageUrls[0],
            },
          ],
        })
      default:
        return null
    }
  } catch (e) {
    if ('replyToken' in event) {
      return lineClient.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: 'text',
            text: '[ERROR] 無法處理此連結',
          },
        ],
      })
    }
  }
}

lineBot.post('/message', async (c) => {
  const body: WebhookRequestBody = await c.req.json()

  return Promise.all(body.events.map(handleLineEvent))
    .then((result) => c.json(result))
    .catch((e: Error) => {
      console.error(e)
    })
})

export { lineBot }
