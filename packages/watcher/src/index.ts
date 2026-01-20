import { getSale } from '@weverse-shop/core'
import { Hono } from 'hono'
import { slack } from './slack'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello from @weverse-shop/watcher')
})

export default {
  fetch: app.fetch,
  // See wrangler.jsonc for information on cron triggers.
  // Currently, it's set to run every 15 minutes.
  scheduled: async (
    controller: ScheduledController,
    env: Cloudflare.Env,
    ctx: ExecutionContext,
  ) => {
    const task = async () => {
      const saleIds = [43782]

      const salesResult = saleIds.map(async (id) => {
        const sales = await getSale(id, {
          currency: 'KRW',
          locale: 'zh-tw',
        })

        console.log(sales.option.options)

        if (sales.status !== 'SOLD_OUT') {
          await slack({
            text: `*[商品到貨通知]*

${sales.name} 現在有貨
款式：${sales.option.options
              .filter((option) => !option.isSoldOut)
              .map((option) => option.saleOptionName)
              .join('、')}

<https://shop.weverse.io/zh-tw/shop/KRW/sales/${id}|前往查看>`,
          })
        }
      })

      await Promise.all(salesResult)
    }
    ctx.waitUntil(task())
  },
}
