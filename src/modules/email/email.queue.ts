import Bull from 'bull';
import { env } from '../../config/env';

export interface EmailJobData {
  recipient: string;
  subject: string;
  body: string;
  tenantId: string;
  template: string;
}

// Bull queue create karo
export const emailQueue = new Bull<EmailJobData>('email-queue', {
  redis: env.REDIS_URL,
  defaultJobOptions: {
    attempts: 3, // Max 3 retries
    backoff: {
      type: 'exponential', // Exponential backoff
      delay: 2000, // 2 seconds se shuru
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

// Dead letter queue
export const deadLetterQueue = new Bull('email-dead-letter', {
  redis: env.REDIS_URL,
});

export const addEmailJob = async (data: EmailJobData) => {
  const job = await emailQueue.add(data);
  console.log(`Email job added to queue: ${job.id}`);
  return job;
};