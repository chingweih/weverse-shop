import { getSale, SalesStatus } from '@weverse-shop/core'
import { line } from './apis/line'
import { db } from './db'
import { card } from './lib/line/ui/card'

function shouldNotify({
  previous,
  current,
}: {
  previous: boolean
  current: boolean
}) {
  return true
  // Previously out of stock, now in stock
  return !previous && current
}

export async function handleScheduledTask() {
  const products = await Promise.all(
    (
      await db.query.productsTable.findMany({
        with: {
          subscriptions: {
            with: {
              user: true, // TODO: Optimize this huge and ugly query...
            },
          },
          variants: true,
        },
      })
    )
      .filter((product) => product.subscriptions.length > 0)
      .map(async (product) => {
        const sale = await getSale(Number(product.saleId), {
          currency: 'KRW',
          locale: 'zh-tw',
        })
        return {
          ...product,
          lastAnyStock: product.variants.some(
            (variant) => variant.lastStatus === SalesStatus.InStock,
          ),
          anyStock: sale.option.options.some((option) => !option.isSoldOut),
          sale,
        }
      }),
  )

  for (const { subscriptions, ...product } of products) {
    for (const subscription of subscriptions) {
      if (
        !subscription.variantId &&
        shouldNotify({
          previous: product.lastAnyStock,
          current: product.anyStock,
        })
      ) {
        await line.pushMessage({
          to: subscription.user.lineUserId,
          messages: [
            card({
              alt: '商品上架通知',
              imageUrl: product.sale.thumbnailImageUrls[0],
              title: '【商品上架通知】',
              description: `你訂閱的 ${product.sale.name} 貨況已更新，請點擊連結查看`,
              customFooter: [
                {
                  type: 'button',
                  action: {
                    type: 'uri',
                    label: '前往商店',
                    uri: `https://shop.weverse.io/zh-tw/shop/USD/sales/${product.saleId}`,
                  },
                },
              ],
            }),
          ],
        })
        continue
      }

      const variant = product.variants.find(
        (variant) => variant.id === subscription.variantId,
      )
      const option = product.sale.option.options.find(
        (option) => option.saleStockId.toString() === variant?.variantStockId,
      )

      if (!variant || !option) {
        continue
      }

      if (
        shouldNotify({
          previous: variant.lastStatus === SalesStatus.InStock,
          current: !option.isSoldOut,
        })
      ) {
        await line.pushMessage({
          to: subscription.user.lineUserId,
          messages: [
            card({
              alt: '商品上架通知',
              imageUrl: product.sale.thumbnailImageUrls[0],
              title: '【商品上架通知】',
              description: `你訂閱的 ${product.sale.name} ${variant.variantName} 貨況已更新，請點擊連結查看`,
              customFooter: [
                {
                  type: 'button',
                  action: {
                    type: 'uri',
                    label: '前往商店',
                    uri: `https://shop.weverse.io/zh-tw/shop/USD/sales/${product.saleId}`,
                  },
                },
              ],
            }),
          ],
        })
        continue
      }
    }
  }
}
