import { emailQueue, deadLetterQueue, EmailJobData } from './email.queue';
import { sendEmail } from './email.service';
import db from '../../config/db';

emailQueue.process(async (job) => {
  const { recipient, subject, body, tenantId, template } = job.data as EmailJobData;

  console.log(`Processing email job ${job.id} for ${recipient}`);

  try {
    // Email bhejo
    const result = await sendEmail(recipient, subject, body);

    // Delivery log update karo — sent
    await db.emailLog.updateMany({
      where: {
        recipient,
        template,
        status: 'pending',
        tenantId,
      },
      data: {
        status: 'sent',
        attemptCount: job.attemptsMade + 1,
      },
    });

    console.log(`Email sent successfully! Preview: ${result.previewUrl}`);
    return result;

  } catch (error) {
    // Delivery log update karo — failed
    await db.emailLog.updateMany({
      where: {
        recipient,
        template,
        status: 'pending',
        tenantId,
      },
      data: {
        attemptCount: job.attemptsMade + 1,
      },
    });

    throw error;
  }
});

// Job permanently fail hone pe dead letter queue mein bhejo
emailQueue.on('failed', async (job, error) => {
  if (job.attemptsMade >= 3) {
    console.log(`Job ${job.id} permanently failed — moving to dead letter queue`);
    await deadLetterQueue.add(job.data);
  }
});

emailQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

console.log('Email worker started ✅');