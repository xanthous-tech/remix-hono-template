import { and, desc, eq, gt } from 'drizzle-orm';
import { z } from 'zod';

import { generateIdFromEntropySize } from '@/utils/crypto';
import { db } from '@/db/drizzle';
import { magicLinkTokenTable } from '@/db/schema';
import { magicLinkTokenSchema } from '@/types/magic-link';

export async function getMagicLinkTokenById(
  id: string,
): Promise<z.infer<typeof magicLinkTokenSchema> | undefined> {
  const magicLinkTokens = await db
    .select()
    .from(magicLinkTokenTable)
    .where(eq(magicLinkTokenTable.id, id))
    .limit(1);

  return magicLinkTokens?.[0];
}

export async function getMagicTokensByEmail(
  email: string,
): Promise<z.infer<typeof magicLinkTokenSchema>[]> {
  const magicLinkTokens = await db
    .select()
    .from(magicLinkTokenTable)
    .where(
      and(
        eq(magicLinkTokenTable.email, email),
        gt(magicLinkTokenTable.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(magicLinkTokenTable.expiresAt));

  return magicLinkTokens;
}

export async function createMagicToken(email: string): Promise<string> {
  // first read the token and creation time from db
  const magicLinkTokens = await getMagicTokensByEmail(email);

  if (magicLinkTokens.length > 0) {
    const magicLinkToken = magicLinkTokens[0];

    // if token is created within the last minute, throw an error to prevent spamming
    if (Date.now() - magicLinkToken.createdAt.getTime() < 1000 * 60) {
      throw new Error('Please wait before requesting another magic link.');
    }

    await db
      .update(magicLinkTokenTable)
      .set({
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 15),
      })
      .where(eq(magicLinkTokenTable.id, magicLinkToken.id));

    return magicLinkToken.id;
  }

  // generate token
  const id = generateIdFromEntropySize(25);

  // save to db, along with its creation time in a hash, and set expiration to 15 minutes
  await db.insert(magicLinkTokenTable).values({
    id,
    email,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 15),
  });

  return id;
}
