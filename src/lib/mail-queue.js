import { prisma } from "./prisma";
import { send } from "./mail";

/**
 * Enqueue an email to be sent by the background worker.
 */
export async function enqueueMail(message) {
  try {
    await prisma.emailJob.create({
      data: {
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        replyTo: message.replyTo,
      },
    });
  } catch (error) {
    console.error("[mail-queue] failed to enqueue", error);
  }
}

/**
 * Flush pending emails. Call this from a cron job.
 */
export async function flushQueue() {
  const jobs = await prisma.emailJob.findMany({
    where: {
      status: "pending",
      nextRetryAt: { lte: new Date() },
      attempts: { lt: 3 }, // Fallback guard
    },
    take: 20, // process in batches
  });

  if (jobs.length === 0) return 0;

  let sentCount = 0;

  for (const job of jobs) {
    // Attempt send
    const result = await send({
      to: job.to,
      subject: job.subject,
      text: job.text,
      html: job.html,
      replyTo: job.replyTo,
    });

    if (result.ok) {
      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: "sent",
          attempts: { increment: 1 },
        },
      });
      sentCount++;
    } else {
      const nextAttempts = job.attempts + 1;
      const hasMoreAttempts = nextAttempts < job.maxAttempts;
      
      // Exponential backoff: next retry in 5, 25, 125... minutes
      const backoffMinutes = Math.pow(5, nextAttempts);
      const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: hasMoreAttempts ? "pending" : "failed",
          attempts: nextAttempts,
          error: result.error,
          nextRetryAt,
        },
      });
    }
  }

  return sentCount;
}
