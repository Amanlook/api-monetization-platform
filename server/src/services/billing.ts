import prisma from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Generate invoices for all active subscriptions at the end of their billing period.
 * Called by cron job daily.
 */
export async function generateInvoices() {
  const now = new Date();

  // Find subscriptions where the current period has ended
  const expiredSubs = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      currentPeriodEnd: { lte: now },
    },
    include: {
      plan: true,
      user: true,
    },
  });

  console.log(`Processing ${expiredSubs.length} subscriptions for invoicing`);

  for (const sub of expiredSubs) {
    try {
      const baseAmount = new Decimal(sub.plan.price);
      let overageCount = 0;
      let overageAmount = new Decimal(0);

      // Calculate overage if applicable
      if (sub.plan.requestLimit !== -1 && sub.requestsUsed > sub.plan.requestLimit) {
        overageCount = sub.requestsUsed - sub.plan.requestLimit;
        if (sub.plan.overagePrice) {
          overageAmount = new Decimal(sub.plan.overagePrice).mul(overageCount);
        }
      }

      const totalAmount = baseAmount.add(overageAmount);

      // Calculate next period
      const nextPeriodEnd = new Date(sub.currentPeriodEnd);
      if (sub.billingCycle === 'MONTHLY') {
        nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
      } else {
        nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
      }

      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 15);

      // Create invoice with line items in a transaction
      await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.create({
          data: {
            userId: sub.userId,
            subscriptionId: sub.id,
            amount: totalAmount,
            status: 'PENDING',
            periodStart: sub.currentPeriodStart,
            periodEnd: sub.currentPeriodEnd,
            requestCount: sub.requestsUsed,
            overageCount,
            overageAmount,
            dueDate,
            lineItems: {
              create: [
                {
                  description: `${sub.plan.name} - ${sub.billingCycle} subscription`,
                  quantity: 1,
                  unitPrice: sub.plan.price,
                  amount: sub.plan.price,
                },
                ...(overageCount > 0 && sub.plan.overagePrice
                  ? [
                      {
                        description: `API overage (${overageCount} requests)`,
                        quantity: overageCount,
                        unitPrice: sub.plan.overagePrice,
                        amount: overageAmount,
                      },
                    ]
                  : []),
              ],
            },
          },
        });

        // Reset subscription for next period
        await tx.subscription.update({
          where: { id: sub.id },
          data: {
            currentPeriodStart: sub.currentPeriodEnd,
            currentPeriodEnd: nextPeriodEnd,
            requestsUsed: 0,
          },
        });

        console.log(`Invoice ${invoice.id} created for user ${sub.userId}: $${totalAmount}`);
      });
    } catch (error) {
      console.error(`Error processing subscription ${sub.id}:`, error);
    }
  }
}

/**
 * Get billing summary for a user
 */
export async function getUserBillingSummary(userId: string) {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId, status: 'ACTIVE' },
    include: {
      plan: {
        include: { apiProduct: { select: { name: true, slug: true } } },
      },
    },
  });

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: { lineItems: true },
  });

  const totalSpent = await prisma.invoice.aggregate({
    where: { userId, status: 'PAID' },
    _sum: { amount: true },
  });

  return {
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      plan: s.plan.name,
      api: s.plan.apiProduct.name,
      status: s.status,
      billingCycle: s.billingCycle,
      price: s.plan.price,
      requestsUsed: s.requestsUsed,
      requestLimit: s.plan.requestLimit,
      usagePercent:
        s.plan.requestLimit === -1
          ? 0
          : Math.round((s.requestsUsed / s.plan.requestLimit) * 100),
      currentPeriodEnd: s.currentPeriodEnd,
    })),
    invoices: invoices.map((i) => ({
      id: i.id,
      amount: i.amount,
      status: i.status,
      periodStart: i.periodStart,
      periodEnd: i.periodEnd,
      requestCount: i.requestCount,
      overageCount: i.overageCount,
      dueDate: i.dueDate,
      paidAt: i.paidAt,
      lineItems: i.lineItems,
    })),
    totalSpent: totalSpent._sum.amount || 0,
  };
}
