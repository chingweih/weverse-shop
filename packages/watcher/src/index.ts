import { getSale } from '@weverse-shop/core'
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello from @weverse-shop/watcher')
})

const saleIds = [43782, 51619]

export default {
  fetch: app.fetch,
  // See wrangler.jsonc for information on cron triggers.
  // Currently, it's set to run every 15 minutes.
  scheduled: async (controller: ScheduledController, env: Env, ctx: ExecutionContext) => {
    const task = async () => {
      const sales = await getSale(43782, {
        currency: 'KRW',
        locale: 'zh-tw',
      })
      console.dir(sales, {depth: Infinity})
    }
    ctx.waitUntil(task())
  },
}
