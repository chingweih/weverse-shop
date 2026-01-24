import { messagingApi } from '@line/bot-sdk'

export function message(text: string): messagingApi.TextMessage {
  return {
    type: 'text',
    text,
  }
}
