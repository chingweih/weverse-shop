import { err, ok, ResultAsync } from 'neverthrow'
import { createTextCommand } from '.'
import { Commands } from '../../../constants/commands'
import { getSubscriptionsByUserId } from '../../../data/subscriptions'
import { card } from '../ui/card'
import { reply } from '../utils/reply'
import { AuthenticationError, DatabaseError } from './errors'

export const handleListSubscriptionsCommand = createTextCommand<
  AuthenticationError | DatabaseError
>({
  handler: async (c) => {
    const user = c.get('user')

    if (!user) {
      return err(new AuthenticationError('user not found'))
    }

    const { id: userId } = user

    const getSubscriptionsResult = await ResultAsync.fromPromise(
      getSubscriptionsByUserId({ userId }),
      (error) =>
        new DatabaseError(
          'get subscriptions by user id',
          (error as Error).cause,
        ),
    )

    if (getSubscriptionsResult.isErr()) {
      return err(getSubscriptionsResult.error)
    }

    const { value: subscriptions } = getSubscriptionsResult

    if (subscriptions.length === 0) {
      return ok(await reply(c, '你現在還沒有訂閱，開始訂閱吧！'))
    }

    return ok(
      await reply(
        c,
        card({
          title: '現有訂閱',
          description: '以下是你現在有訂閱的品項，點擊即可刪除',
          imageUrl: 'https://picsum.photos/200/300', // TODO: Replace placeholder image
          actions: subscriptions.map((sub) => ({
            label: sub.variant?.variantName ?? '無品名', // TODO: Fix type and include product only subscription name
            message: `${Commands.DeleteSubscription} ${sub.id}`,
          })),
        }),
      ),
    )
  },
  onError: {
    AuthenticationError: '未登入',
    DatabaseError: '資料庫錯誤',
  },
})
