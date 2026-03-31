import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminHash = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@apiplatform.com' },
    update: {},
    create: {
      email: 'admin@apiplatform.com',
      passwordHash: adminHash,
      name: 'Platform Admin',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  // Create test developer
  const devHash = await bcrypt.hash('developer123', 12);
  const developer = await prisma.user.upsert({
    where: { email: 'dev@example.com' },
    update: {},
    create: {
      email: 'dev@example.com',
      passwordHash: devHash,
      name: 'John Developer',
      company: 'Dev Corp',
      role: 'DEVELOPER',
      emailVerified: true,
    },
  });

  // Create sample API products
  const weatherApi = await prisma.apiProduct.upsert({
    where: { slug: 'weather-api' },
    update: {},
    create: {
      name: 'Weather API',
      slug: 'weather-api',
      description: 'Real-time weather data for any location worldwide. Get current conditions, forecasts, and historical data.',
      baseUrl: 'https://api.open-meteo.com',
      basePath: '/weather',
      status: 'ACTIVE',
      version: '2.0.0',
      tags: ['weather', 'geolocation', 'data'],
      documentation: `# Weather API

## Overview
Get real-time weather data for any location worldwide.

## Endpoints

### GET /current
Get current weather conditions.

**Parameters:**
- \`lat\` (required) - Latitude
- \`lon\` (required) - Longitude

### GET /forecast
Get 7-day weather forecast.

**Parameters:**
- \`lat\` (required) - Latitude
- \`lon\` (required) - Longitude
- \`days\` (optional) - Number of days (1-14)

## Response Example
\`\`\`json
{
  "temperature": 22.5,
  "humidity": 65,
  "conditions": "Partly Cloudy",
  "wind_speed": 12.3
}
\`\`\`
`,
    },
  });

  const geocodingApi = await prisma.apiProduct.upsert({
    where: { slug: 'geocoding-api' },
    update: {},
    create: {
      name: 'Geocoding API',
      slug: 'geocoding-api',
      description: 'Convert addresses to coordinates and vice versa. Supports worldwide coverage with high accuracy.',
      baseUrl: 'https://geocode.maps.co',
      basePath: '/geocoding',
      status: 'ACTIVE',
      version: '1.0.0',
      tags: ['geocoding', 'maps', 'location'],
      documentation: `# Geocoding API

## Endpoints

### GET /forward
Convert address to coordinates.

### GET /reverse
Convert coordinates to address.
`,
    },
  });

  const sentimentApi = await prisma.apiProduct.upsert({
    where: { slug: 'sentiment-api' },
    update: {},
    create: {
      name: 'Sentiment Analysis API',
      slug: 'sentiment-api',
      description: 'AI-powered text sentiment analysis. Analyze customer feedback, reviews, and social media posts.',
      baseUrl: 'https://httpbin.org',
      basePath: '/sentiment',
      status: 'ACTIVE',
      version: '1.0.0',
      tags: ['ai', 'nlp', 'text-analysis'],
    },
  });

  // Create plans for Weather API
  const weatherFree = await prisma.plan.upsert({
    where: { slug: 'weather-free' },
    update: {},
    create: {
      apiProductId: weatherApi.id,
      name: 'Free',
      slug: 'weather-free',
      description: 'Perfect for testing and small projects',
      planType: 'FREE',
      price: 0,
      requestLimit: 1000,
      rateLimit: 10,
      sortOrder: 0,
    },
  });

  await prisma.plan.upsert({
    where: { slug: 'weather-starter' },
    update: {},
    create: {
      apiProductId: weatherApi.id,
      name: 'Starter',
      slug: 'weather-starter',
      description: 'For growing applications',
      planType: 'TIERED',
      price: 29,
      yearlyPrice: 290,
      requestLimit: 50000,
      rateLimit: 60,
      overagePrice: 0.001,
      sortOrder: 1,
      features: { historicalData: true, webhooks: false, prioritySupport: false },
    },
  });

  await prisma.plan.upsert({
    where: { slug: 'weather-pro' },
    update: {},
    create: {
      apiProductId: weatherApi.id,
      name: 'Professional',
      slug: 'weather-pro',
      description: 'For production workloads',
      planType: 'TIERED',
      price: 99,
      yearlyPrice: 990,
      requestLimit: 500000,
      rateLimit: 300,
      overagePrice: 0.0005,
      sortOrder: 2,
      features: { historicalData: true, webhooks: true, prioritySupport: true },
    },
  });

  await prisma.plan.upsert({
    where: { slug: 'weather-enterprise' },
    update: {},
    create: {
      apiProductId: weatherApi.id,
      name: 'Enterprise',
      slug: 'weather-enterprise',
      description: 'Unlimited access with dedicated support',
      planType: 'ENTERPRISE',
      price: 499,
      yearlyPrice: 4990,
      requestLimit: -1,
      rateLimit: 1000,
      sortOrder: 3,
      features: { historicalData: true, webhooks: true, prioritySupport: true, sla: true, dedicatedSupport: true },
    },
  });

  // Plans for Geocoding API
  await prisma.plan.upsert({
    where: { slug: 'geocoding-free' },
    update: {},
    create: {
      apiProductId: geocodingApi.id,
      name: 'Free',
      slug: 'geocoding-free',
      planType: 'FREE',
      price: 0,
      requestLimit: 500,
      rateLimit: 5,
      sortOrder: 0,
    },
  });

  await prisma.plan.upsert({
    where: { slug: 'geocoding-pro' },
    update: {},
    create: {
      apiProductId: geocodingApi.id,
      name: 'Professional',
      slug: 'geocoding-pro',
      planType: 'PAY_AS_YOU_GO',
      price: 49,
      requestLimit: 100000,
      rateLimit: 100,
      overagePrice: 0.0003,
      sortOrder: 1,
    },
  });

  // Plans for Sentiment API
  await prisma.plan.upsert({
    where: { slug: 'sentiment-starter' },
    update: {},
    create: {
      apiProductId: sentimentApi.id,
      name: 'Starter',
      slug: 'sentiment-starter',
      planType: 'TIERED',
      price: 19,
      requestLimit: 10000,
      rateLimit: 30,
      sortOrder: 0,
    },
  });

  await prisma.plan.upsert({
    where: { slug: 'sentiment-business' },
    update: {},
    create: {
      apiProductId: sentimentApi.id,
      name: 'Business',
      slug: 'sentiment-business',
      planType: 'TIERED',
      price: 79,
      requestLimit: 100000,
      rateLimit: 200,
      overagePrice: 0.001,
      sortOrder: 1,
    },
  });

  // Create endpoints
  await prisma.apiEndpoint.createMany({
    skipDuplicates: true,
    data: [
      { apiProductId: weatherApi.id, method: 'GET', path: '/current', description: 'Get current weather conditions' },
      { apiProductId: weatherApi.id, method: 'GET', path: '/forecast', description: 'Get weather forecast' },
      { apiProductId: weatherApi.id, method: 'GET', path: '/historical', description: 'Get historical weather data' },
      { apiProductId: geocodingApi.id, method: 'GET', path: '/forward', description: 'Address to coordinates' },
      { apiProductId: geocodingApi.id, method: 'GET', path: '/reverse', description: 'Coordinates to address' },
      { apiProductId: sentimentApi.id, method: 'POST', path: '/analyze', description: 'Analyze text sentiment' },
      { apiProductId: sentimentApi.id, method: 'POST', path: '/batch', description: 'Batch sentiment analysis' },
    ],
  });

  // Create a subscription for the test developer
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await prisma.subscription.upsert({
    where: { userId_planId: { userId: developer.id, planId: weatherFree.id } },
    update: {},
    create: {
      userId: developer.id,
      planId: weatherFree.id,
      status: 'ACTIVE',
      currentPeriodEnd: periodEnd,
    },
  });

  console.log('Seed complete!');
  console.log('Admin login: admin@apiplatform.com / admin123456');
  console.log('Developer login: dev@example.com / developer123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
