import { Context } from 'hono'
import { LineBotRoute } from '../../../routes/line'
import { messagingApi } from '@line/bot-sdk'
import { line } from '../../../apis/line'
import { message } from '../ui/text'

export async function reply(
  c: Context<LineBotRoute>,
  messages: messagingApi.Message[] | messagingApi.Message | string,
) {
  return await line.replyMessage({
    replyToken: c.var.replyToken,
    messages: Array.isArray(messages)
      ? messages
      : [typeof messages === 'string' ? message(messages) : messages],
  })
}
