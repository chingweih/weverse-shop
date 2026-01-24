import { messagingApi } from '@line/bot-sdk'
import { Context } from 'hono'
import { Result } from 'neverthrow'
import { LineBotRoute } from '../../../routes/line'
import { reply } from '../utils/reply'

type ExtractErrorNames<T extends Error> = T['name']

type ErrorHandlers<Errors extends Error> = {
  [K in ExtractErrorNames<Errors>]:
    | ((
        c: Context<LineBotRoute>,
        error: Extract<Errors, { name: K }>,
      ) => Promise<messagingApi.ReplyMessageResponse>)
    | string
}

export function createTextCommand<Errors extends Error>({
  handler,
  onError,
}: {
  handler: (
    c: Context<LineBotRoute>,
    message: messagingApi.TextMessage,
  ) => Promise<Result<messagingApi.ReplyMessageResponse, Errors>>
  onError: ErrorHandlers<Errors>
}) {
  return async (
    c: Context<LineBotRoute>,
    message: messagingApi.TextMessage,
  ) => {
    const result = await handler(c, message)

    if (result.isOk()) {
      return result.value
    }

    const errorName = result.error.name as Errors['name']
    const errorHandler = onError[errorName]

    if (!errorHandler) {
      return await reply(c, `【錯誤】請檢查你的訊息或稍後再試`)
    }

    if (typeof errorHandler === 'string') {
      return await reply(
        c,
        `【錯誤】請檢查你的訊息或稍後再試

${errorHandler}`,
      )
    }

    return await errorHandler(c, result.error as any)
  }
}
