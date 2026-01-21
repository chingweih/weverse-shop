import { validateSignature } from '@line/bot-sdk'
import { LINE_SIGNATURE_HTTP_HEADER_NAME } from '@line/bot-sdk'
import { env } from 'cloudflare:workers'
import { Hono } from 'hono'

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

lineBot.post('/message', async (c) => {
  return c.json({ success: true })
})

export { lineBot }
