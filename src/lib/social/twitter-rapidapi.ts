// Twitter API via RapidAPI
// https://rapidapi.com/api-sports/api/twitter-x-api

import { SocialPost, PostMetrics, Platform } from "@/types";

const X_RAPIDAPI_KEY = process.env.X_RAPIDAPI_KEY;
const X_RAPIDAPI_HOST_TWITTER = process.env.X_RAPIDAPI_HOST_TWITTER;

interface TwitterPost {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count?: number;
    bookmark_count?: number;
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

interface TwitterProfile {
  id: string;
  username: string;
  name: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count?: number;
  };
  description?: string;
  profile_image_url?: string;
}

/**
 * Get user tweets via RapidAPI
 */
export async function getUserTweets(
  username: string,
  limit: number = 25,
): Promise<SocialPost[]> {
  try {
    if (!X_RAPIDAPI_KEY || !X_RAPIDAPI_HOST_TWITTER) {
      throw new Error("Missing RapidAPI Twitter credentials");
    }

    const url = `https://${X_RAPIDAPI_HOST_TWITTER}/user/tweets?username=${username}&limit=${Math.min(limit, 100)}`;

    const response = await fetch(url, {
      headers: {
        "x-rapidapi-key": X_RAPIDAPI_KEY,
        "x-rapidapi-host": X_RAPIDAPI_HOST_TWITTER,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();
    const tweets = (data.data || []) as TwitterPost[];

    return tweets.map((tweet) => transformTweet(tweet));
  } catch (error) {
    console.error("Error fetching Twitter tweets:", error);
    throw error;
  }
}

/**
 * Get user profile via RapidAPI
 */
export async function getUserProfile(username: string): Promise<{
  followers: number;
  following: number;
  tweetCount: number;
  name: string;
  bio: string;
  profileImage: string;
}> {
  try {
    if (!X_RAPIDAPI_KEY || !X_RAPIDAPI_HOST_TWITTER) {
      throw new Error("Missing RapidAPI Twitter credentials");
    }

    const url = `https://${X_RAPIDAPI_HOST_TWITTER}/user/profile?username=${username}`;

    const response = await fetch(url, {
      headers: {
        "x-rapidapi-key": X_RAPIDAPI_KEY,
        "x-rapidapi-host": X_RAPIDAPI_HOST_TWITTER,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();
    const profile = (data.data || {}) as TwitterProfile;
    const metrics = profile.public_metrics || {};

    return {
      followers: metrics.followers_count || 0,
      following: metrics.following_count || 0,
      tweetCount: metrics.tweet_count || 0,
      name: profile.name || "",
      bio: profile.description || "",
      profileImage: profile.profile_image_url || "",
    };
  } catch (error) {
    console.error("Error fetching Twitter profile:", error);
    return {
      followers: 0,
      following: 0,
      tweetCount: 0,
      name: "",
      bio: "",
      profileImage: "",
    };
  }
}

/**
 * Search tweets via RapidAPI
 */
export async function searchTweets(
  query: string,
  limit: number = 25,
): Promise<SocialPost[]> {
  try {
    if (!X_RAPIDAPI_KEY || !X_RAPIDAPI_HOST_TWITTER) {
      throw new Error("Missing RapidAPI Twitter credentials");
    }

    const url = `https://${X_RAPIDAPI_HOST_TWITTER}/search/tweets?query=${encodeURIComponent(query)}&limit=${Math.min(limit, 100)}`;

    const response = await fetch(url, {
      headers: {
        "x-rapidapi-key": X_RAPIDAPI_KEY,
        "x-rapidapi-host": X_RAPIDAPI_HOST_TWITTER,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();
    const tweets = (data.data || []) as TwitterPost[];

    return tweets.map((tweet) => transformTweet(tweet));
  } catch (error) {
    console.error("Error searching Twitter tweets:", error);
    throw error;
  }
}

/**
 * Transform Twitter API response to SocialPost format
 */
function transformTweet(tweet: TwitterPost): SocialPost {
  const metrics = tweet.public_metrics;

  // Determine post type based on attachments
  let postType: SocialPost["type"] = "text";
  let mediaUrl: string | undefined;
  let thumbnailUrl: string | undefined;

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
  const impressions = metrics.impression_count || totalEngagement * 10;
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

/**
 * Get trending topics
 */
export async function getTrendingTopics(woeid: number = 1): Promise<
  Array<{
    name: string;
    tweetVolume: number;
  }>
> {
  try {
    if (!X_RAPIDAPI_KEY || !X_RAPIDAPI_HOST_TWITTER) {
      throw new Error("Missing RapidAPI Twitter credentials");
    }

    const url = `https://${X_RAPIDAPI_HOST_TWITTER}/trends/place?woeid=${woeid}`;

    const response = await fetch(url, {
      headers: {
        "x-rapidapi-key": X_RAPIDAPI_KEY,
        "x-rapidapi-host": X_RAPIDAPI_HOST_TWITTER,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();
    const trends = (data.data || []) as Array<{
      name: string;
      tweet_volume?: number;
    }>;

    return trends.map((trend) => ({
      name: trend.name,
      tweetVolume: trend.tweet_volume || 0,
    }));
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    return [];
  }
}
