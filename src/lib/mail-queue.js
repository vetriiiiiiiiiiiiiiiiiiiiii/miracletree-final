import { prisma } from "./prisma";
import { mailConfigured, send } from "./mail";

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
 * Sends what is due in the queue. Called right after an email is queued and
 * every minute by the loop in start.sh, which also covers retries.
 *
 * Each job is claimed before it is sent — status "sending", and its retry
 * time pushed ten minutes out — so the immediate flush and the minute loop
 * cannot both send it. A claim left behind by a crash simply comes due again.
 * With no mail provider configured nothing is attempted, so jobs wait rather
 * than burning their retries.
 */
export async function flushQueue() {
  if (!mailConfigured()) return 0;
  const jobs = await prisma.emailJob.findMany({
    where: {
      status: { in: ["pending", "sending"] },
      nextRetryAt: { lte: new Date() },
      attempts: { lt: 3 }, // Fallback guard
    },
    orderBy: { createdAt: "asc" },
    take: 20, // process in batches
  });
  let sentCount = 0;
  for (const job of jobs) {
    const claim = await prisma.emailJob.updateMany({
      where: { id: job.id, nextRetryAt: job.nextRetryAt },
      data: { status: "sending", nextRetryAt: new Date(Date.now() + 10 * 60 * 1000) },
    });
    if (claim.count !== 1) continue; // another flush has it
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
        data: { status: "sent", attempts: { increment: 1 }, error: null },
      });
      sentCount++;
    } else {
      const nextAttempts = job.attempts + 1;
      const hasMoreAttempts = nextAttempts < job.maxAttempts;
      // Exponential backoff: next retry in 5, 25, 125... minutes
      const backoffMinutes = Math.pow(5, nextAttempts);
      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: hasMoreAttempts ? "pending" : "failed",
          attempts: nextAttempts,
          error: result.error,
          nextRetryAt: new Date(Date.now() + backoffMinutes * 60 * 1000),
        },
      });
    }
  }
  return sentCount;
}
