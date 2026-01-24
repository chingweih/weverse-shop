import { env } from 'cloudflare:workers'

export async function slack({ text }: { text: string }) {
  const response = await fetch(env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text,
    }),
  })

  if (!response.ok) {
    throw Error('Slack Error')
  }

  return true
}
