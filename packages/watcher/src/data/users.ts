import { db } from '../db'
import { usersTable } from '../db/schema'

export async function getUser({ lineUserId }: { lineUserId: string }) {
  const [user] = await db
    .insert(usersTable)
    .values({
      lineUserId,
    })
    .onConflictDoUpdate({
      target: usersTable.lineUserId,
      set: { lineUserId },
    })
    .returning()

  return user
}
