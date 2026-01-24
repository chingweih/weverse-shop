import type { WebhookRequestBody } from '@line/bot-sdk'
import { Hono } from 'hono'
import { User } from '../data/types'
import { handleLineEvent } from '../lib/line/handlers/event'
import { reply } from '../lib/line/utils/reply'
import { lineSignatureMiddleware } from '../middlewares/line-signature'

export type LineBotRoute = { Variables: { user: User; replyToken: string } }

const lineBotRoute = new Hono<LineBotRoute>()

lineBotRoute.use('*', lineSignatureMiddleware)

lineBotRoute.post('/message', async (c) => {
  const body: WebhookRequestBody = await c.req.json()

  return Promise.all(body.events.map((event) => handleLineEvent(c, event)))
    .then((result) => c.json(result))
    .catch((e: Error) => {
      console.error(e)
    })
})

lineBotRoute.onError(async (err, c) => {
  const replyToken = c.get('replyToken')

  if (!replyToken) {
    return c.body(null, 500)
  }

  await reply(c, '系統錯誤，請重試')

  return c.body(null, 200)
})

export { lineBotRoute }
