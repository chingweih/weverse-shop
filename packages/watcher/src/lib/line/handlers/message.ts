import type { MessageEvent } from '@line/bot-sdk'
import type { Context } from 'hono'
import { Commands } from '../../../constants/commands'
import type { LineBotRoute } from '../../../routes/line'
import { handleDeleteSubscriptionCommand } from '../commands/delete-subscription'
import { handleListSubscriptionsCommand } from '../commands/list-subscriptions'
import { handleSubscribeCommand } from '../commands/subscribe'
import { handleTrackCommand } from '../commands/track'
import { reply } from '../utils/reply'
import { MessageTypeNotSupportedError } from './errors'

export async function handleLineMessage(
  c: Context<LineBotRoute>,
  event: MessageEvent,
) {
  if (event.message.type !== 'text') {
    // Only handle text message
    throw new MessageTypeNotSupportedError(event.message.type)
  }

  const {
    message: { text },
  } = event

  if (text.startsWith(Commands.Track)) {
    return await handleTrackCommand(c, event.message)
  }

  if (text.startsWith(Commands.Subscribe)) {
    return await handleSubscribeCommand(c, event.message)
  }

  if (text.startsWith(Commands.ListSubscription)) {
    return await handleListSubscriptionsCommand(c, event.message)
  }

  if (text.startsWith(Commands.DeleteSubscription)) {
    return await handleDeleteSubscriptionCommand(c, event.message)
  }

  // Default message handler
  return await reply(
    c,
    `哈囉，請輸入以下指令來跟機器人互動
- ${Commands.Track} {Weverse Shop 連結}：開始選擇訂閱機制
- ${Commands.ListSubscription}：列出已訂閱的商品通知`,
  )
}
