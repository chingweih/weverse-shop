import { getSale } from '../lib/client'
import { getBuildId } from '../lib/buildid'

import type { SaleData, Locale, Currency } from '../lib/types'

type SaleCommandOptions = {
  saleId: number
  artistId?: number
  locale: string
  currency: string
  json?: boolean
  refreshCache?: boolean
}

function formatPrice(price: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    KRW: 'KRW ',
    JPY: 'JPY ',
    CNY: 'CNY ',
    MXN: 'MXN $',
  }
  const symbol = symbols[currency] ?? ''
  return `${symbol}${price.toLocaleString()}`
}

function formatSalePretty(sale: SaleData, currency: string): string {
  const availableOptions = sale.option.options.filter((opt) => !opt.isSoldOut).length
  const soldOutOptions = sale.option.options.filter((opt) => opt.isSoldOut).length
  const totalOptions = sale.option.options.length

  const optionsLine =
    totalOptions > 0
      ? `   Options:  ${availableOptions} available` +
        (soldOutOptions > 0 ? ` (${soldOutOptions} sold out)` : '') +
        ` of ${totalOptions} total`
      : '   Options:  None'

  const optionsList = sale.option.options
    .map((opt) => {
      const status = opt.isSoldOut ? '[SOLD OUT]' : '[In Stock]'
      return `     - ${opt.saleOptionName} ${status} (${formatPrice(opt.optionSalePrice, currency)})`
    })
    .join('\n')

  const discountLine =
    sale.price.discountPercent > 0
      ? `   Discount: ${sale.price.discountPercent}% off (Original: ${formatPrice(sale.price.originalPrice, currency)})`
      : ''

  return `
================================================================================
  WEVERSE SHOP - SALE INFORMATION
================================================================================

  [Product Details]
   ID:       ${sale.saleId}
   Name:     ${sale.name}
   Status:   ${sale.status}
   Type:     ${sale.sectionType}
   Partner:  ${sale.partnerCode}

  [Artist]
   Name:     ${sale.labelArtistInfo.name} (${sale.labelArtistInfo.shortName})
   ID:       ${sale.labelArtistInfo.labelArtistId}

  [Pricing]
   Price:    ${formatPrice(sale.price.salePrice, currency)}
${discountLine ? discountLine + '\n' : ''}   Cash:     ${formatPrice(sale.price.earnedCash, currency)} earned
   Tax:      ${sale.price.isTaxIncluded ? 'Included' : 'Not included'}

  [Availability]
   Sale Start: ${sale.saleStartAt}
   Cart:       ${sale.isCartUsable ? 'Available' : 'Not available'}
   Shipping:   ${sale.isShippingAddressRequired ? 'Required' : 'Not required'}

  [Options]
${optionsLine}
${optionsList}

  [Order Limits]
${sale.orderLimitInfo.descriptions.map((d) => `   - ${d}`).join('\n')}

  [Features]
   - Digital Live: ${sale.isDigitalLive ? 'Yes' : 'No'}
   - Membership Benefit: ${sale.isMembershipBenefit ? 'Yes' : 'No'}
   - Share Enabled: ${sale.isShareEnable ? 'Yes' : 'No'}

  [Images]
   Thumbnails: ${sale.thumbnailImageUrls.length}
   Details:    ${sale.detailImages.length}

================================================================================
`.trim()
}

export async function getSaleCommand(options: SaleCommandOptions): Promise<void> {
  try {
    if (options.refreshCache) {
      console.log('Refreshing buildId cache...')
      const newBuildId = await getBuildId(true)
      console.log(`New buildId: ${newBuildId}\n`)
    }

    console.log(`Fetching sale data for ID: ${options.saleId}...`)

    const sale = await getSale(options.saleId, {
      artistId: options.artistId,
      locale: options.locale as Locale,
      currency: options.currency as Currency,
    })

    if (options.json) {
      console.log(JSON.stringify(sale, null, 2))
    } else {
      console.log(formatSalePretty(sale, options.currency))
    }
  } catch (error) {
    console.error('\n[ERROR]', error instanceof Error ? error.message : String(error))
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}
