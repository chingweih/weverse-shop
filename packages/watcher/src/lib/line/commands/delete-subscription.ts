import { err, ok, ResultAsync } from 'neverthrow'
import { createTextCommand } from '.'
import { Commands } from '../../../constants/commands'
import {
  deleteSubscription,
  getSubscription,
} from '../../../data/subscriptions'
import { reply } from '../utils/reply'
import {
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  InvalidInputError,
} from './errors'

class SubscriptionNotFoundError extends Error {
  readonly name = 'SubscriptionNotFoundError' as const
  constructor(subscriptionId: number) {
    super(`Subscription not found: ${subscriptionId}`)
  }
}

export const handleDeleteSubscriptionCommand = createTextCommand<
  | AuthenticationError
  | InvalidInputError
  | DatabaseError
  | SubscriptionNotFoundError
  | AuthorizationError
>({
  handler: async (c, message) => {
    const user = c.get('user')

    if (!user) {
      return err(new AuthenticationError('user not found'))
    }

    const idString = message.text
      .replace(Commands.DeleteSubscription, '')
      .trim()

    if (idString.length === 0) {
      return err(new InvalidInputError(message.text))
    }

    const id = Number(idString)

    const getSubscriptionResult = await ResultAsync.fromPromise(
      getSubscription({ id }),
      (error) => new DatabaseError('get subscription', (error as Error).cause),
    )

    if (getSubscriptionResult.isErr()) {
      return err(getSubscriptionResult.error)
    }

    const { value: subscription } = getSubscriptionResult

    if (!subscription) {
      return err(new SubscriptionNotFoundError(id))
    }

    if (user.id != subscription.userId) {
      return err(new AuthorizationError('subscription not belong to user'))
    }

    const deleteSubscriptionResult = await ResultAsync.fromPromise(
      deleteSubscription({ id }),
      (error) =>
        new DatabaseError('delete subscription', (error as Error).cause),
    )

    if (deleteSubscriptionResult.isErr()) {
      return err(deleteSubscriptionResult.error)
    }

    return ok(await reply(c, '刪除成功'))
  },
  onError: {
    AuthenticationError: '未登入',
    AuthorizationError: '訂閱不存在',
    DatabaseError: '資料庫錯誤',
    InvalidInputError: '未輸入訂閱 ID',
    SubscriptionNotFoundError: '訂閱不存在',
  },
})
