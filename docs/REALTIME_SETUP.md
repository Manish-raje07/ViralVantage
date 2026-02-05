# Real-Time Data Integration Guide

This guide explains how to set up real-time data collection from actual social media APIs instead of using demo/sample data.

## Overview

The project now uses only **real API data** from social platforms. Demo data generators have been removed. All components fetch live metrics and posts from actual social media accounts.

## Required Setup

### 1. Twitter API v2 (Real-Time Posts)

#### Prerequisites

- Twitter Developer Account with API access
- Elevated access tier (for streaming endpoints)

#### Configuration

1. Get your credentials from [Twitter Developer Portal](https://developer.twitter.com/en/portal):
   - Bearer Token (OAuth 2.0)
   - User ID (your account ID)

2. Add to `.env.local`:

```env
TWITTER_BEARER_TOKEN=your_bearer_token_here
TWITTER_USER_ID=your_user_id_here
```

3. **Real-Time Endpoint**: `/api/realtime/twitter`
   - Query params: `userId`, `bearerToken` (or use env vars)
   - Returns: Server-Sent Events (SSE) stream of tweets
   - Refresh rate: 5 seconds

#### Client Hook Usage

```typescript
import { useTwitterRealtime } from '@/hooks/useTwitterRealtime';

export function MyComponent() {
  const { data, status, error } = useTwitterRealtime({
    userId: process.env.NEXT_PUBLIC_TWITTER_USER_ID,
    bearerToken: process.env.TWITTER_BEARER_TOKEN,
  });

  return (
    <div>
      {status === 'open' && <p>Connected to real-time stream</p>}
      {data.map(tweet => <div key={tweet.postId}>{tweet.content}</div>)}
    </div>
  );
}
```

### 2. Instagram API (Business Account)

#### Prerequisites

- Instagram Business Account
- Facebook App with Instagram Graph API access

#### Configuration

1. Get access token from [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/):
   - Access Token (long-lived)
   - Business Account ID

2. Add to `.env.local`:

```env
INSTAGRAM_ACCESS_TOKEN=your_access_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_account_id_here
```

3. **Functions** in `src/lib/social/instagram.ts`:
   - `getUserPosts()` - Fetch recent posts
   - `getProfileMetrics()` - Get follower counts, reach, impressions
   - Transform data to `SocialPost` type

### 3. MongoDB (Data Persistence)

Store fetched data in MongoDB collections for:

- Historical analytics
- Trend analysis
- Caching to reduce API calls

#### Collections

- `platforms` - Account metrics per platform
- `posts` - Individual post data
- `dailyMetrics` - Aggregated daily stats
- `insights` - AI-generated insights

#### Connection

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/social-media-dashboard
```

### 4. Gemini AI (Insights)

Generate data-driven insights from real metrics.

```env
GEMINI_API_KEY=your_api_key_here
```

See `src/lib/gemini.ts` for integration.

## API Routes

### Analytics (`/api/analytics`)

Fetches real platform metrics from MongoDB:

```bash
GET /api/analytics?platform=twitter&period=30&type=overview
```

### Real-Time Twitter (`/api/realtime/twitter`)

Server-Sent Events stream of new tweets:

```bash
GET /api/realtime/twitter?userId=xxx&bearerToken=yyy
```

### Insights (`/api/insights`)

AI-powered insights from real data:

```bash
GET /api/insights
```

## Components Updated

The following components now fetch real data:

- **PostsSection** - Fetches from `/api/analytics?type=posts`
- **EngagementSection** - Fetches from `/api/analytics?type=engagement`
- **UsersSection** - Awaits user API endpoint (not yet implemented)
- **DashboardSection** - Uses real metrics from MongoDB
- **AnalyticsSection** - Displays real platform metrics

## Testing Real Data

### 1. Start Dev Server

```bash
npm run dev
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in real credentials:

```bash
cp .env.example .env.local
```

### 3. Seed Initial Data

Run the seed script to populate MongoDB:

```bash
npx ts-node scripts/seed-data.ts
```

### 4. Test Real-Time Endpoint

Open in browser or curl:

```bash
curl "http://localhost:3000/api/realtime/twitter?userId=xxx&bearerToken=yyy"
```

You should see SSE events with real tweets.

## Limitations & Notes

### Rate Limits

- Twitter API: 300 requests/15 minutes
- Instagram: 200 requests/hour
- Implement caching to stay within limits

### Streaming Limitations

- Basic polling (5s interval) used instead of native streaming
- For true streaming, use:
  - Twitter API v2 Streaming endpoints (requires elevated access)
  - Instagram Webhooks (for real-time notifications)

### Demo Mode Removed

- `generateSampleTwitterData()` removed from `twitter.ts`
- `generateSampleInstagramData()` removed from `instagram.ts`
- Hook `useTwitterRealtime` now requires credentials (no demo mode)

## Next Steps

1. **Set up MongoDB cluster** and update `MONGODB_URI`
2. **Get API credentials** from Twitter and Instagram developer portals
3. **Add env vars** to `.env.local`
4. **Run seed script** to populate initial data
5. **Start dev server** and test real-time endpoints
6. **Monitor API quotas** and implement caching if needed

## Troubleshooting

### "Missing credentials" error

Ensure `TWITTER_BEARER_TOKEN` and `TWITTER_USER_ID` are set in `.env.local`

### No data appearing

1. Check MongoDB connection in `MONGODB_URI`
2. Run seed script to populate data
3. Verify API credentials have proper permissions

### Rate limit errors

- Add caching layer (Redis)
- Increase polling interval beyond 5 seconds
- Use webhook endpoints instead of polling

## Support

For API documentation:

- [Twitter API v2 Docs](https://developer.twitter.com/en/docs/twitter-api)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-graph-api)
- [MongoDB Node Driver](https://www.mongodb.com/docs/drivers/node/)
