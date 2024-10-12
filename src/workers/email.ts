import { Job, Worker } from 'bullmq';

import { SUBSCRIBE_SUCCESS, MAGIC_LINK } from '@/types/email';
import { EMAIL, EmailJobData, emailJobDataSchema } from '@/types/jobs/email';
import { defaultWorkerOptions } from '@/lib/bullmq';
import { logger as parentLogger } from '@/utils/logger';
import { renderSubscribeSuccessEmail } from '@/emails/subscribe-success';
import { renderMagicLinkEmail } from '@/emails/magic-link';

const logger = parentLogger.child({ worker: EMAIL });
logger.trace(`register worker for queue ${EMAIL}`);

async function emailWorkerProcess(job: Job<EmailJobData>) {
  const input: EmailJobData = emailJobDataSchema.parse(job.data);

  const { emailType, emailTo, emailArgs } = input;

  switch (emailType) {
    case SUBSCRIBE_SUCCESS: {
      const subscribeSuccessEmail = renderSubscribeSuccessEmail();
      return subscribeSuccessEmail;
    }
    case MAGIC_LINK: {
      const magicLinkEmail = renderMagicLinkEmail(emailArgs);
      return magicLinkEmail;
    }
    default: {
      throw new Error(`Unknown email type: ${emailType}`);
    }
  }
}

const emailWorker = new Worker(EMAIL, emailWorkerProcess, {
  ...defaultWorkerOptions,
  concurrency: 1,
});

export default emailWorker;
