import { env } from 'cloudflare:workers'
import { css, Style } from 'hono/css'

const body = css`
  font-family: 'Roboto Slab Variable', 'Noto Sans TC Variable', sans-serif;
  background-color: #fafafa;
`

const container = css`
  width: 100svw;
  max-width: 36rem;
  height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;

  h1 {
    font-size: 2rem;
  }
`

const content = css`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 30px;
  padding: 30px;

  button {
    padding: 4px 20px;
    border-radius: 1rem;
    background-color: #00cbd5;
    color: white;
    font-weight: 600;
  }

  p {
    text-align: center;
    text-wrap: pretty;
    color: #555;
  }
`

const footer = css`
  position: fixed;
  bottom: 16px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 14px;
  color: #909090;

  a:hover {
    text-decoration: underline;
  }
`

export function LandingPage() {
  return (
    <html>
      <head>
        <link
          rel='stylesheet'
          href='https://cdn.jsdelivr.net/npm/tailwindcss-preflight@1.0.1/preflight.min.css'
          crossorigin='anonymous'
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
        @font-face {
          font-family: 'Roboto Slab Variable';
          font-style: normal;
          font-display: fallback;
          font-weight: 100 900;
          src: url(https://cdn.jsdelivr.net/fontsource/fonts/roboto-slab:vf@latest/latin-wght-normal.woff2)
            format('woff2-variations');
          unicode-range:
            U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
            U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193,
            U+2212, U+2215, U+FEFF, U+FFFD;
        }

        /* noto-sans-tc-latin-wght-normal */
        @font-face {
          font-family: 'Noto Sans TC Variable';
          font-style: normal;
          font-display: swap;
          font-weight: 100 900;
          src: url(https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-tc:vf@latest/latin-wght-normal.woff2) format('woff2-variations');
          unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
        }

        /* noto-sans-tc-chinese-traditional-wght-normal */
        @font-face {
          font-family: 'Noto Sans TC Variable';
          font-style: normal;
          font-display: swap;
          font-weight: 100 900;
          src: url(https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-tc:vf@latest/chinese-traditional-wght-normal.woff2) format('woff2-variations');
        }
        `,
          }}
        />
        <Style />
      </head>
      <body class={body}>
        <div class={container}>
          <div class={content}>
            <h1>有貨噴霧</h1>
            <p>自動追蹤商品庫存，補貨時發送 Line 通知，讓你全收速匯！</p>
            <a
              href={`https://line.me/R/ti/p/@${env.LINE_BOT_ID}`}
              target='_blank'
            >
              <button>加入好友</button>
            </a>
          </div>
          <div class={footer}>
            <a href='https://ethanhuang.me' target='_blank'>
              Ethan Huang
            </a>
            <span>｜</span>
            <a href='https://github.com/chingweih/weverse-shop' target='_blank'>
              Github
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
