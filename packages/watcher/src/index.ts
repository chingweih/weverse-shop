import { Hono } from 'hono'
import { lineBotRoute } from './routes/line'
import { handleScheduledTask } from './scheduled'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello from @weverse-shop/watcher')
})

app.route('/line', lineBotRoute)

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
    ctx.waitUntil(handleScheduledTask())
  },
}
