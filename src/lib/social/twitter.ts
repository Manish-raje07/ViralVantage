// Twitter API v2 wrapper
// Documentation: https://developer.twitter.com/en/docs/twitter-api

import { SocialPost, PostMetrics, Platform } from "@/types";

const TWITTER_API_BASE = "https://api.twitter.com/2";

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count?: number;
  };
  entities?: {
    hashtags?: Array<{ tag: string }>;
    mentions?: Array<{ username: string }>;
  };
  attachments?: {
    media_keys?: string[];
  };
}

interface TwitterMedia {
  media_key: string;
  type: "photo" | "video" | "animated_gif";
  url?: string;
  preview_image_url?: string;
}

// Get user's tweets
export async function getUserTweets(
  bearerToken: string,
  userId: string,
  limit: number = 25,
): Promise<SocialPost[]> {
  try {
    const url = `${TWITTER_API_BASE}/users/${userId}/tweets?max_results=${Math.min(limit, 100)}&tweet.fields=created_at,public_metrics,entities,attachments&expansions=attachments.media_keys&media.fields=type,url,preview_image_url`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();
    const mediaMap = new Map<string, TwitterMedia>();

    // Build media map
    for (const media of data.includes?.media || []) {
      mediaMap.set(media.media_key, media);
    }

    const posts: SocialPost[] = (data.data || []).map((tweet: Tweet) =>
      transformTweet(tweet, mediaMap),
    );

    return posts;
  } catch (error) {
    console.error("Error fetching tweets:", error);
    throw error;
  }
}

// Get user profile with metrics
export async function getUserProfile(
  bearerToken: string,
  userId: string,
): Promise<{
  followers: number;
  following: number;
  tweetCount: number;
}> {
  try {
    const url = `${TWITTER_API_BASE}/users/${userId}?user.fields=public_metrics`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();
    const metrics = data.data?.public_metrics || {};

    return {
      followers: metrics.followers_count || 0,
      following: metrics.following_count || 0,
      tweetCount: metrics.tweet_count || 0,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      followers: 0,
      following: 0,
      tweetCount: 0,
    };
  }
}

// Transform Twitter API response to our SocialPost format
function transformTweet(
  tweet: Tweet,
  mediaMap: Map<string, TwitterMedia>,
): SocialPost {
  const metrics = tweet.public_metrics;

  // Determine post type based on attachments
  let postType: SocialPost["type"] = "text";
  let mediaUrl: string | undefined;
  let thumbnailUrl: string | undefined;

  if (tweet.attachments?.media_keys?.length) {
    const media = mediaMap.get(tweet.attachments.media_keys[0]);
    if (media) {
      switch (media.type) {
        case "video":
          postType = "video";
          thumbnailUrl = media.preview_image_url;
          break;
        case "animated_gif":
          postType = "video";
          thumbnailUrl = media.preview_image_url;
          break;
        case "photo":
        default:
          postType = "static";
          mediaUrl = media.url;
          thumbnailUrl = media.url;
      }
    }
  }

  // Extract hashtags
  const hashtags = tweet.entities?.hashtags?.map((h) => h.tag) || [];

  // Extract mentions
  const mentions = tweet.entities?.mentions?.map((m) => m.username) || [];

  // Calculate engagement
  const totalEngagement =
    metrics.like_count +
    metrics.retweet_count +
    metrics.reply_count +
    metrics.quote_count;
  const impressions = metrics.impression_count || totalEngagement * 10; // Estimate if not available
  const engagementRate =
    impressions > 0 ? (totalEngagement / impressions) * 100 : 0;

  const postMetrics: PostMetrics = {
    likes: metrics.like_count,
    comments: metrics.reply_count,
    shares: metrics.retweet_count + metrics.quote_count,
    reach: impressions,
    impressions: impressions,
    engagementRate: Math.round(engagementRate * 100) / 100,
  };

  return {
    platform: "twitter" as Platform,
    postId: tweet.id,
    type: postType,
    content: tweet.text,
    mediaUrl,
    thumbnailUrl,
    publishedAt: new Date(tweet.created_at),
    metrics: postMetrics,
    hashtags,
    mentions,
    syncedAt: new Date(),
  };
}
