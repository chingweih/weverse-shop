import { createSelectSchema } from 'drizzle-zod'
import { productsTable, usersTable } from '../db/schema'
import { z } from 'zod'

export const userSelectSchema = createSelectSchema(usersTable)
export type User = z.infer<typeof userSelectSchema>

export const productSelectSchema = createSelectSchema(productsTable)
export type Product = z.infer<typeof productSelectSchema>
