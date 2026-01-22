import { messagingApi } from '@line/bot-sdk'
import { env } from 'cloudflare:workers'

export const line = new messagingApi.MessagingApiClient({
  channelAccessToken: env.LINE_BOT_ACCESS_TOKEN,
})
