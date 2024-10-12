import { z } from 'zod';

import { MAGIC_LINK, SUBSCRIBE_SUCCESS } from '@/types/email';

export const EMAIL = 'email';

export const emailJobDataSchema = z.object({
  emailType: z.enum([SUBSCRIBE_SUCCESS, MAGIC_LINK]),
  emailTo: z.string(),
  emailArgs: z.any(),
});

export type EmailJobData = z.infer<typeof emailJobDataSchema>;
