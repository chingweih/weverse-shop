import { relations, sql } from 'drizzle-orm'
import {
  index,
  int,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const usersTable = sqliteTable('users', {
  id: int().primaryKey({ autoIncrement: true }),
  lineUserId: text('line_user_id').notNull().unique(),
  createdAt: int('created_at', { mode: 'timestamp' }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
})

export const usersRelations = relations(usersTable, ({ many }) => ({
  subscriptions: many(subscriptionsTable),
}))

export const productsTable = sqliteTable('products', {
  id: int().primaryKey({ autoIncrement: true }),
  type: text({ enum: ['weverse'] }).default('weverse'),
  saleId: text('sale_id').notNull(),
  lastCheckedAt: int('last_checked_at', { mode: 'timestamp' }),
  createdAt: int('created_at').default(new Date().getTime()),
})

export const productsRelations = relations(productsTable, ({ many }) => ({
  variants: many(variantsTable),
  subscriptions: many(subscriptionsTable),
}))

export const variantsTable = sqliteTable(
  'variants',
  {
    id: int('id').primaryKey({ autoIncrement: true }),
    productId: int('product_id')
      .notNull()
      .references(() => productsTable.id, { onDelete: 'cascade' }),
    variantName: text('variant_name').notNull(),
    variantStockId: text('variant_id').notNull(),
    lastStatus: text('last_status'),
    createdAt: int('created_at', { mode: 'timestamp' }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
  },
  (table) => [
    uniqueIndex('unique_variant_per_product').on(
      table.productId,
      table.variantStockId,
    ),
    index('idx_variants_product').on(table.productId),
  ],
)

export const variantsRelations = relations(variantsTable, ({ one, many }) => ({
  product: one(productsTable, {
    fields: [variantsTable.productId],
    references: [productsTable.id],
  }),
  subscriptions: many(subscriptionsTable),
}))

export const subscriptionsTable = sqliteTable(
  'subscriptions',
  {
    id: int().primaryKey({ autoIncrement: true }),
    userId: int('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    productId: int('product_id')
      .notNull()
      .references(() => productsTable.id, { onDelete: 'cascade' }),
    variantId: int('variant_id').references(() => variantsTable.id, {
      onDelete: 'cascade',
    }),
    createdAt: int('created_at', { mode: 'timestamp' }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
  },
  (table) => [
    uniqueIndex('idx_subs_specific')
      .on(table.userId, table.variantId)
      .where(sql`${table.variantId} IS NOT NULL`),
    uniqueIndex('idx_subs_any')
      .on(table.userId, table.productId)
      .where(sql`${table.variantId} IS NULL`),
    index('idx_subs_product').on(table.productId),
  ],
)

export const subscriptionsRelations = relations(
  subscriptionsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [subscriptionsTable.userId],
      references: [usersTable.id],
    }),
    product: one(productsTable, {
      fields: [subscriptionsTable.productId],
      references: [productsTable.id],
    }),
    variant: one(variantsTable, {
      fields: [subscriptionsTable.variantId],
      references: [variantsTable.id],
    }),
  }),
)
