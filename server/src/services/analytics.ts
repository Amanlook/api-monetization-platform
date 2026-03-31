import prisma from '../lib/prisma';
import redis from '../lib/redis';

/**
 * Get real-time analytics for an API product
 */
export async function getApiAnalytics(apiProductId: string, days: number = 7) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  // Get daily stats from usage logs
  const dailyStats = await prisma.$queryRaw<any[]>`
    SELECT 
      DATE(timestamp) as date,
      COUNT(*)::int as total_requests,
      COUNT(CASE WHEN "statusCode" >= 200 AND "statusCode" < 400 THEN 1 END)::int as success_count,
      COUNT(CASE WHEN "statusCode" >= 400 THEN 1 END)::int as error_count,
      ROUND(AVG("responseTimeMs")::numeric, 2) as avg_response_ms,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "responseTimeMs") as p95_response_ms,
      COUNT(DISTINCT "userId")::int as unique_users
    FROM usage_logs
    WHERE "apiProductId" = ${apiProductId}
      AND timestamp >= ${startDate}
    GROUP BY DATE(timestamp)
    ORDER BY date ASC
  `;

  // Get top endpoints
  const topEndpoints = await prisma.$queryRaw<any[]>`
    SELECT 
      method,
      path,
      COUNT(*)::int as request_count,
      ROUND(AVG("responseTimeMs")::numeric, 2) as avg_response_ms,
      COUNT(CASE WHEN "statusCode" >= 400 THEN 1 END)::int as error_count
    FROM usage_logs
    WHERE "apiProductId" = ${apiProductId}
      AND timestamp >= ${startDate}
    GROUP BY method, path
    ORDER BY request_count DESC
    LIMIT 10
  `;

  // Get status code distribution
  const statusDistribution = await prisma.$queryRaw<any[]>`
    SELECT 
      "statusCode" as status_code,
      COUNT(*)::int as count
    FROM usage_logs
    WHERE "apiProductId" = ${apiProductId}
      AND timestamp >= ${startDate}
    GROUP BY "statusCode"
    ORDER BY count DESC
  `;

  // Get top users
  const topUsers = await prisma.$queryRaw<any[]>`
    SELECT 
      u.id,
      u.name,
      u.email,
      COUNT(*)::int as request_count
    FROM usage_logs ul
    JOIN users u ON u.id = ul."userId"
    WHERE ul."apiProductId" = ${apiProductId}
      AND ul.timestamp >= ${startDate}
    GROUP BY u.id, u.name, u.email
    ORDER BY request_count DESC
    LIMIT 10
  `;

  // Get today's real-time stats from Redis
  const dateKey = now.toISOString().split('T')[0];
  const todayStats = await redis.hgetall(`stats:${apiProductId}:${dateKey}`);

  // Get hourly breakdown for today
  const hourlyData = [];
  for (let h = 0; h <= now.getHours(); h++) {
    hourlyData.push({
      hour: h,
      requests: parseInt(todayStats[`h${h}`] || '0', 10),
    });
  }

  return {
    summary: {
      totalRequests: dailyStats.reduce((sum, d) => sum + d.total_requests, 0),
      successRate: dailyStats.length
        ? (
            (dailyStats.reduce((s, d) => s + d.success_count, 0) /
              dailyStats.reduce((s, d) => s + d.total_requests, 0)) *
            100
          ).toFixed(1)
        : '0',
      avgResponseMs: dailyStats.length
        ? (dailyStats.reduce((s, d) => s + parseFloat(d.avg_response_ms), 0) / dailyStats.length).toFixed(1)
        : '0',
      uniqueUsers: new Set(topUsers.map((u) => u.id)).size,
    },
    dailyStats,
    topEndpoints,
    statusDistribution,
    topUsers,
    today: {
      total: parseInt(todayStats['total'] || '0', 10),
      hourlyData,
    },
  };
}

/**
 * Get developer's usage analytics
 */
export async function getDeveloperAnalytics(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const usage = await prisma.$queryRaw<any[]>`
    SELECT 
      DATE(timestamp) as date,
      ap.name as api_name,
      COUNT(*)::int as requests,
      ROUND(AVG("responseTimeMs")::numeric, 2) as avg_latency,
      COUNT(CASE WHEN "statusCode" >= 400 THEN 1 END)::int as errors
    FROM usage_logs ul
    JOIN api_products ap ON ap.id = ul."apiProductId"
    WHERE ul."userId" = ${userId}
      AND ul.timestamp >= ${startDate}
    GROUP BY DATE(timestamp), ap.name
    ORDER BY date ASC
  `;

  const totals = await prisma.usageLog.aggregate({
    where: { userId, timestamp: { gte: startDate } },
    _count: true,
    _avg: { responseTimeMs: true },
  });

  return { dailyUsage: usage, totals };
}

/**
 * Aggregate analytics into the aggregation table (for cron job)
 */
export async function aggregateAnalytics() {
  const now = new Date();
  const hourAgo = new Date(now);
  hourAgo.setHours(hourAgo.getHours() - 1);
  hourAgo.setMinutes(0, 0, 0);

  const apis = await prisma.apiProduct.findMany({ where: { status: 'ACTIVE' } });

  for (const api of apis) {
    try {
      const stats = await prisma.usageLog.aggregate({
        where: {
          apiProductId: api.id,
          timestamp: { gte: hourAgo, lt: now },
        },
        _count: true,
        _avg: { responseTimeMs: true },
      });

      const errorCount = await prisma.usageLog.count({
        where: {
          apiProductId: api.id,
          timestamp: { gte: hourAgo, lt: now },
          statusCode: { gte: 400 },
        },
      });

      const uniqueUsers = await prisma.usageLog.groupBy({
        by: ['userId'],
        where: {
          apiProductId: api.id,
          timestamp: { gte: hourAgo, lt: now },
        },
      });

      if (stats._count > 0) {
        await prisma.analyticsAggregation.upsert({
          where: {
            apiProductId_period_periodStart: {
              apiProductId: api.id,
              period: 'HOURLY',
              periodStart: hourAgo,
            },
          },
          create: {
            apiProductId: api.id,
            period: 'HOURLY',
            periodStart: hourAgo,
            totalRequests: stats._count,
            successCount: stats._count - errorCount,
            errorCount,
            avgResponseMs: stats._avg.responseTimeMs || 0,
            uniqueUsers: uniqueUsers.length,
          },
          update: {
            totalRequests: stats._count,
            successCount: stats._count - errorCount,
            errorCount,
            avgResponseMs: stats._avg.responseTimeMs || 0,
            uniqueUsers: uniqueUsers.length,
          },
        });
      }
    } catch (error) {
      console.error(`Analytics aggregation error for ${api.id}:`, error);
    }
  }
}
