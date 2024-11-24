import { createSelectSchema } from 'drizzle-zod';

import { magicLinkTokenTable } from '@/db/schema';

export const magicLinkTokenSchema = createSelectSchema(magicLinkTokenTable);
