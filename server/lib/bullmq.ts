import { QueueEventsOptions, QueueOptions, WorkerOptions } from 'bullmq';

import { redisConnectionOptions } from '@/db/redis';

const prefix = process.env.MQ_PREFIX ?? 'bullmq';

export const defaultQueueOptions: QueueOptions = {
  connection: {
    ...redisConnectionOptions,
    enableOfflineQueue: false,
  },
  prefix,
  streams: {
    events: {
      maxLen: 100,
    },
  },
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false,
    attempts: 10,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
};

export const defaultQueueEventsOptions: QueueEventsOptions = {
  connection: redisConnectionOptions,
  prefix,
};
export const defaultWorkerOptions: WorkerOptions = {
  connection: redisConnectionOptions,
  prefix,
  concurrency: 10,
};
