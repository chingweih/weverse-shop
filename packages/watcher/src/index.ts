import { Hono } from 'hono'
import { lineBotRoute } from './routes/line'
import { handleScheduledTask } from './scheduled'
import { LandingPage } from './ui/landing'

const app = new Hono()

app.get('/', (c) => {
  return c.render(LandingPage())
})

app.route('/line', lineBotRoute)

export default {
  // REST API Handler
  fetch: app.fetch,

  // Cron job handler
  // Run every 15 minutes, see wrangler.jsonc for more information
  scheduled: async (controller, env, ctx) => {
    ctx.waitUntil(handleScheduledTask())
  },
} satisfies ExportedHandler<Cloudflare.Env, unknown, unknown>
