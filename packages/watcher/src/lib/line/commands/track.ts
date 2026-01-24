import { extractSaleIdFromUrl, getSale } from '@weverse-shop/core'
import { err, ok, ResultAsync } from 'neverthrow'
import { createTextCommand } from '.'
import { Commands } from '../../../constants/commands'
import { upsertProduct } from '../../../data/products'
import { upsertVariantsFromSale } from '../../../data/variants'
import { DatabaseError, InvalidUrlError, SaleNotFoundError } from './errors'
import { card } from '../ui/card'
import { reply } from '../utils/reply'

export const handleTrackCommand = createTextCommand<
  DatabaseError | InvalidUrlError | SaleNotFoundError
>({
  handler: async (c, message) => {
    const url = message.text.replace(Commands.Track, '').trim()
    const saleId = extractSaleIdFromUrl(url)

    if (!saleId) {
      return err(new InvalidUrlError(url))
    }

    const saleResult = await ResultAsync.fromPromise(
      getSale(saleId),
      () => new SaleNotFoundError(saleId.toString()),
    )
      .andThen((sale) => {
        return ResultAsync.fromPromise(
          upsertProduct({ sale }).then((product) => ({ sale, product })),
          (error) =>
            new DatabaseError('upsert product', (error as Error).cause),
        )
      })
      .andThen(({ sale, product }) => {
        return ResultAsync.fromPromise(
          upsertVariantsFromSale({ sale, product }).then((variants) => ({
            sale,
            product,
            variants,
          })),
          (error) =>
            new DatabaseError('upsert variants', (error as Error).cause),
        )
      })

    if (saleResult.isErr()) {
      return err(saleResult.error)
    }

    const {
      value: { sale, product, variants },
    } = saleResult

    return ok(
      await reply(
        c,
        card({
          imageUrl: sale.thumbnailImageUrls[0],
          title: '商品查詢結果',
          description: `以下是 ${sale.name} 的所有品項，請選擇想要訂閱的品項，或是訂閱任一品項`,
          actions: [
            ...sale.option.options.map((option) => ({
              label: option.saleOptionName,
              message: `${Commands.Subscribe} ${saleId} ${option.saleStockId}`,
            })),
            {
              label: '訂閱任一品項',
              message: `${Commands.Subscribe} ${saleId}`,
            },
          ],
        }),
      ),
    )
  },
  onError: {
    InvalidUrlError: '網址錯誤',
    SaleNotFoundError: '無法找到商品或目前不支援此類型商品',
    DatabaseError: '資料庫錯誤',
  },
})
