import cron from 'node-cron';
import { generateInvoices } from './services/billing';
import { aggregateAnalytics } from './services/analytics';

export function startCronJobs() {
  // Aggregate analytics every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running analytics aggregation...');
    try {
      await aggregateAnalytics();
      console.log('[CRON] Analytics aggregation complete');
    } catch (error) {
      console.error('[CRON] Analytics aggregation failed:', error);
    }
  });

  // Generate invoices daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running invoice generation...');
    try {
      await generateInvoices();
      console.log('[CRON] Invoice generation complete');
    } catch (error) {
      console.error('[CRON] Invoice generation failed:', error);
    }
  });

  console.log('Cron jobs started');
}
