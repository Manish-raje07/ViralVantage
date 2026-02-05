# Real-Time Social Media API Integration Setup

This guide explains how to use the real-time API integrations for fetching live data from Twitter, Instagram, and YouTube.

## Architecture Overview

The dashboard now fetches real data from three social media platforms:

- **Twitter/X**: Via RapidAPI (`twitter-x-api`)
- **Instagram**: Via RapidAPI (`instagram-scraper-stable-api`)
- **YouTube**: Via Google Data API v3

All APIs run through centralized library functions in `src/lib/social/`:

- `twitter-rapidapi.ts` - Twitter/X data fetching
- `instagram-rapidapi.ts` - Instagram data fetching
- `youtube.ts` - YouTube data fetching

## API Endpoints

### GET `/api/analytics?type=posts`

Fetches posts from all configured social platforms.

**Query Parameters:**

- `limit` (number, default: 20) - Number of posts to fetch
- `platform` (string, optional) - Specific platform: `twitter`, `instagram`, `youtube`
- `twitterHandle` (string, default: `twitter`) - Twitter username to fetch from
- `instagramHandle` (string, default: `instagram`) - Instagram account to fetch from
- `youtubeChannelId` (string, default: `UC_x5XG1OV2P6uZZ5FSM9Ttw`) - YouTube channel ID

**Response Example:**

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "platform": "twitter",
        "postId": "123456789",
        "type": "text",
        "content": "Tweet content here",
        "publishedAt": "2026-02-06T10:30:00Z",
        "metrics": {
          "likes": 42,
          "comments": 5,
          "shares": 3,
          "impressions": 1200,
          "engagementRate": 4.17
        },
        "hashtags": ["example", "twitter"],
        "mentions": ["@user1", "@user2"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8,
      "hasMore": true
    }
  }
}
```

### GET `/api/realtime/twitter?username={handle}`

Real-time tweet streaming via Server-Sent Events (SSE).

**Parameters:**

- `username` (string, required) - Twitter handle to stream from

**Connection:**

```javascript
const eventSource = new EventSource("/api/realtime/twitter?username=twitter");

eventSource.addEventListener("tweet", (event) => {
  const tweet = JSON.parse(event.data);
  console.log("New tweet:", tweet);
});

eventSource.addEventListener("error", (event) => {
  console.error("Stream error:", JSON.parse(event.data));
});
```

## Environment Variables

Create a `.env.local` file with the following:

```
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# RapidAPI (shared across Twitter and Instagram)
X_RAPIDAPI_KEY=your_rapidapi_key
X_RAPIDAPI_HOST_TWITTER=twitter-x-api.p.rapidapi.com
X_RAPIDAPI_HOST_INSTAGRAM=instagram-scraper-stable-api.p.rapidapi.com

# Google APIs
YOUTUBE_API_KEY=your_youtube_api_key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

## Library Functions

### Twitter (`src/lib/social/twitter-rapidapi.ts`)

```typescript
// Get tweets from a user
const posts = await getUserTweets("twitter", 25);

// Get user profile information
const profile = await getUserProfile("twitter");

// Search tweets by keyword
const results = await searchTweets("react", 25);

// Get trending topics
const trends = await getTrendingTopics(1); // woeid=1 is worldwide
```

### Instagram (`src/lib/social/instagram-rapidapi.ts`)

```typescript
// Get posts from an account
const posts = await getInstagramPosts("instagram", 20);

// Get account profile information
const profile = await getInstagramProfile("instagram");

// Search by hashtag
const results = await searchInstagramHashtag("photography", 20);
```

### YouTube (`src/lib/social/youtube.ts`)

```typescript
// Get channel videos
const videos = await getChannelVideos("UC_x5XG1OV2P6uZZ5FSM9Ttw", 20);

// Get channel metrics
const metrics = await getChannelMetrics("UC_x5XG1OV2P6uZZ5FSM9Ttw");

// Search videos
const results = await searchYouTubeVideos("Next.js tutorial", 20);
```

## React Hook: `useTwitterRealtime`

For real-time Twitter data in components:

```typescript
import { useTwitterRealtime } from '@/hooks/useTwitterRealtime';

export function TwitterFeed() {
  const { data, status, error } = useTwitterRealtime({
    username: 'nextjs',
  });

  if (status === 'error') return <p>Error: {error}</p>;
  if (status === 'connecting') return <p>Connecting...</p>;

  return (
    <div>
      {data.map(tweet => (
        <div key={tweet.postId}>
          <p>{tweet.content}</p>
          <p>❤️ {tweet.metrics.likes}</p>
        </div>
      ))}
    </div>
  );
}
```

## Error Handling

All API functions include error handling:

```typescript
try {
  const tweets = await getUserTweets("twitter", 25);
} catch (error) {
  console.error("Failed to fetch tweets:", error);
  // Fallback UI or empty state
}
```

The `/api/analytics` endpoint includes a fallback mechanism - if API calls fail, it will attempt to serve cached data from MongoDB.

## Rate Limiting

**RapidAPI:**

- Twitter: 100 requests/month free tier
- Instagram: 100 requests/month free tier

**Google APIs:**

- YouTube: 10,000 units/day (free tier)

**Caching Strategy:** Consider implementing Redis or in-memory caching to respect rate limits:

```typescript
// Example: Cache for 15 minutes
const cache = new Map<string, { data: any; time: number }>();

export async function getCachedTweets(username: string) {
  const cached = cache.get(username);
  const now = Date.now();

  if (cached && now - cached.time < 15 * 60 * 1000) {
    return cached.data;
  }

  const data = await getUserTweets(username);
  cache.set(username, { data, time: now });
  return data;
}
```

## Testing

**Test the analytics endpoint:**

```bash
curl "http://localhost:3000/api/analytics?type=posts&limit=5"
```

**Test with specific platform:**

```bash
curl "http://localhost:3000/api/analytics?type=posts&platform=twitter&twitterHandle=nextjs"
```

**Test real-time streaming:**

```bash
curl -N "http://localhost:3000/api/realtime/twitter?username=twitter"
```

## Troubleshooting

### 401/403 Errors

- Verify API keys in `.env.local`
- Check RapidAPI subscription status
- Ensure YouTube API is enabled in Google Cloud Console

### Empty Results

- Verify username/handle exists
- Check rate limit status
- Instagram/Twitter accounts must be public
- YouTube channel must have public videos

### Slow Responses

- APIs are making real HTTP requests - first call takes 1-2 seconds
- Consider implementing caching for better performance
- RapidAPI free tier has strict rate limits

## Next Steps

1. **Implement Caching**: Add Redis or in-memory cache to respect rate limits
2. **Add Error Boundaries**: Wrap API calls with React error boundaries
3. **Database Persistence**: Store fetched posts in MongoDB for analytics
4. **Webhook Updates**: Set up webhooks for real-time notifications
5. **Advanced Filtering**: Add date ranges, engagement filters, etc.

## Related Files

- [src/lib/social/twitter-rapidapi.ts](../src/lib/social/twitter-rapidapi.ts)
- [src/lib/social/instagram-rapidapi.ts](../src/lib/social/instagram-rapidapi.ts)
- [src/lib/social/youtube.ts](../src/lib/social/youtube.ts)
- [src/app/api/analytics/route.ts](../src/app/api/analytics/route.ts)
- [src/app/api/realtime/twitter/route.ts](../src/app/api/realtime/twitter/route.ts)
- [src/hooks/useTwitterRealtime.ts](../src/hooks/useTwitterRealtime.ts)
