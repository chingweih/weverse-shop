import { z } from 'zod'

import type { LOCALES, CURRENCIES } from './constants'

export const priceInfoSchema = z.object({
  originalPrice: z.number(),
  salePrice: z.number(),
  discountPercent: z.number(),
  isDiscountDisplay: z.boolean(),
  earnedCash: z.number(),
  isTaxIncluded: z.boolean(),
  isTaxDeductible: z.boolean(),
})

export const artistInfoSchema = z.object({
  labelArtistId: z.number(),
  name: z.string(),
  shortName: z.string(),
  logoImageUrl: z.string(),
})

export const detailImageSchema = z.object({
  imageUrl: z.string(),
  width: z.number(),
  height: z.number(),
})

export const shippingInfoSchema = z.object({
  shippingGroupId: z.number(),
})

export const orderLimitInfoSchema = z.object({
  descriptions: z.array(z.string()),
})

export const optionOrderLimitSchema = z.object({
  orderLimitType: z.string(),
  maxOrderQuantity: z.number(),
})

export const saleOptionSchema = z.object({
  saleStockId: z.number(),
  saleStockIds: z.array(z.number()),
  saleOptionName: z.string(),
  isSoldOut: z.boolean(),
  optionOrderLimit: optionOrderLimitSchema.optional(),
  variantOptionLocation: z.array(z.unknown()),
  optionAddPrice: z.number(),
  optionSalePrice: z.number(),
})

export const optionInfoSchema = z.object({
  optionSelectionType: z.string(),
  options: z.array(saleOptionSchema),
  hasOptionAddPrice: z.boolean(),
  variants: z.array(z.unknown()),
})

export const notificationInfoSchema = z.object({
  title: z.string(),
  description: z.string(),
})

export const descriptionInfoSchema = z.object({
  descriptions: z.array(z.string()),
})

export const saleDataSchema = z.object({
  saleId: z.number(),
  partnerCode: z.string(),
  sectionType: z.string(),
  thumbnailImageUrls: z.array(z.string()),
  status: z.string(),
  statusCode: z.string(),
  labelArtistInfo: artistInfoSchema,
  name: z.string(),
  price: priceInfoSchema,
  icons: z.array(z.string()),
  emblems: z.array(z.unknown()),
  saleStartAt: z.string(),
  eventGuides: z.array(z.unknown()),
  shipping: shippingInfoSchema,
  orderLimitInfo: orderLimitInfoSchema,
  detailImages: z.array(detailImageSchema),
  isShareEnable: z.boolean(),
  isDigitalLive: z.boolean(),
  isMembershipBenefit: z.boolean(),
  isCartUsable: z.boolean(),
  isCartButtonDisplay: z.boolean(),
  isShippingAddressRequired: z.boolean(),
  isOrderLimitedPerUser: z.boolean(),
  isSeoReport: z.boolean(),
  option: optionInfoSchema,
  cautionInfos: z.array(z.unknown()),
  descriptionInfos: z.array(descriptionInfoSchema).optional(),
  notificationInfos: z.array(notificationInfoSchema),
  returnInfosId: z.number().optional(),
  relatedSaleGroupId: z.number().optional(),
  metaTag: z.record(z.unknown()).optional(),
})

export type PriceInfo = z.infer<typeof priceInfoSchema>
export type ArtistInfo = z.infer<typeof artistInfoSchema>
export type DetailImage = z.infer<typeof detailImageSchema>
export type ShippingInfo = z.infer<typeof shippingInfoSchema>
export type OrderLimitInfo = z.infer<typeof orderLimitInfoSchema>
export type SaleOption = z.infer<typeof saleOptionSchema>
export type OptionInfo = z.infer<typeof optionInfoSchema>
export type NotificationInfo = z.infer<typeof notificationInfoSchema>
export type DescriptionInfo = z.infer<typeof descriptionInfoSchema>
export type SaleData = z.infer<typeof saleDataSchema>

export type Locale = (typeof LOCALES)[number]
export type Currency = (typeof CURRENCIES)[number]

export type GetSaleOptions = {
  artistId?: number
  locale?: Locale
  currency?: Currency
}

export type BuildIdCacheData = {
  buildId: string
  timestamp: number
}
