import { getSale } from '@weverse-shop/core'
import { Hono } from 'hono'
import { slack } from './slack'
import { lineBot } from './line'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello from @weverse-shop/watcher')
})

app.route('/line', lineBot)

export default {
  // REST API Handler
  fetch: app.fetch,

  // Cron job hanlder
  // Run every 15 minutes, see wrangler.jsonc for more information
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
