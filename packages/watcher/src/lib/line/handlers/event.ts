import { Context } from 'hono'
import { LineBotRoute } from '../../../routes/line'
import { WebhookEvent } from '@line/bot-sdk'
import { line } from '../../../apis/line'
import { getUser } from '../../../data/users'
import { handleLineMessage } from './message'

export async function handleLineEvent(
  c: Context<LineBotRoute>,
  event: WebhookEvent,
) {
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

  if ('replyToken' in event) {
    c.set('replyToken', event.replyToken)
  }

  switch (type) {
    case 'message':
      return handleLineMessage(c, event)
    default:
      return null
  }
}
