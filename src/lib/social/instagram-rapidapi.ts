// Instagram API via RapidAPI
// https://rapidapi.com/codersmile/api/instagram-scraper-stable-api

import { SocialPost, PostMetrics, Platform } from "@/types";

const X_RAPIDAPI_KEY = process.env.X_RAPIDAPI_KEY;
const X_RAPIDAPI_HOST = process.env.X_RAPIDAPI_HOST;

interface InstagramPost {
  id: string;
  caption: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL";
  media_url: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  reach?: number;
  impressions?: number;
  engagement?: {
    saves?: number;
    shares?: number;
  };
}

/**
 * Fetch Instagram posts for a user using RapidAPI
 */
export async function getInstagramPosts(
  instagramUserId: string,
  limit: number = 25,
): Promise<SocialPost[]> {
  try {
    if (!X_RAPIDAPI_KEY || !X_RAPIDAPI_HOST) {
      throw new Error("Missing RapidAPI credentials");
    }

    const url = `https://${X_RAPIDAPI_HOST}/ig/posts?ig_username=${instagramUserId}&count=${limit}`;

    const response = await fetch(url, {
      headers: {
        "x-rapidapi-key": X_RAPIDAPI_KEY,
        "x-rapidapi-host": X_RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();
    const posts = (data.data || []) as InstagramPost[];

    return posts.map((post) => transformInstagramPost(post));
  } catch (error) {
    console.error("Error fetching Instagram posts:", error);
    throw error;
  }
}

/**
 * Get Instagram user profile info
 */
export async function getInstagramProfile(instagramUserId: string): Promise<{
  followers: number;
  following: number;
  postCount: number;
  biography: string;
  profilePictureUrl: string;
}> {
  try {
    if (!X_RAPIDAPI_KEY || !X_RAPIDAPI_HOST) {
      throw new Error("Missing RapidAPI credentials");
    }

    const url = `https://${X_RAPIDAPI_HOST}/ig/user_info?ig_username=${instagramUserId}`;

    const response = await fetch(url, {
      headers: {
        "x-rapidapi-key": X_RAPIDAPI_KEY,
        "x-rapidapi-host": X_RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();
    const userInfo = data.data || {};

    return {
      followers: userInfo.followers_count || 0,
      following: userInfo.follows_count || 0,
      postCount: userInfo.media_count || 0,
      biography: userInfo.biography || "",
      profilePictureUrl: userInfo.profile_pic_url || "",
    };
  } catch (error) {
    console.error("Error fetching Instagram profile:", error);
    return {
      followers: 0,
      following: 0,
      postCount: 0,
      biography: "",
      profilePictureUrl: "",
    };
  }
}

/**
 * Transform Instagram API response to SocialPost format
 */
function transformInstagramPost(post: InstagramPost): SocialPost {
  // Determine post type
  let postType: SocialPost["type"] = "static";
  if (post.media_type === "VIDEO") {
    postType = "video";
  } else if (post.media_type === "CAROUSEL") {
    postType = "carousel";
  }

  // Calculate engagement
  const likes = post.like_count || 0;
  const comments = post.comments_count || 0;
  const saves = post.engagement?.saves || 0;
  const shares = post.engagement?.shares || 0;
  const reach = post.reach || likes * 8;
  const impressions = post.impressions || reach * 1.3;
  const totalEngagement = likes + comments + saves + shares;
  const engagementRate =
    impressions > 0 ? (totalEngagement / impressions) * 100 : 0;

  const postMetrics: PostMetrics = {
    likes,
    comments,
    shares,
    reach,
    impressions,
    engagementRate: Math.round(engagementRate * 100) / 100,
  };

  // Extract hashtags from caption
  const hashtags = (post.caption?.match(/#\w+/g) || []).map((tag) =>
    tag.substring(1),
  );

  // Extract mentions from caption
  const mentions = (post.caption?.match(/@\w+/g) || []).map((mention) =>
    mention.substring(1),
  );

  return {
    platform: "instagram" as Platform,
    postId: post.id,
    type: postType,
    content: post.caption || "",
    mediaUrl: post.media_url,
    thumbnailUrl: post.media_url,
    publishedAt: new Date(post.timestamp),
    metrics: postMetrics,
    hashtags,
    mentions,
    syncedAt: new Date(),
  };
}

/**
 * Search Instagram hashtags
 */
export async function searchInstagramHashtag(hashtag: string): Promise<{
  tagName: string;
  postCount: number;
}> {
  try {
    if (!X_RAPIDAPI_KEY || !X_RAPIDAPI_HOST) {
      throw new Error("Missing RapidAPI credentials");
    }

    const url = `https://${X_RAPIDAPI_HOST}/ig/hashtag_search?hashtag=${hashtag}`;

    const response = await fetch(url, {
      headers: {
        "x-rapidapi-key": X_RAPIDAPI_KEY,
        "x-rapidapi-host": X_RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();
    const hashtagInfo = data.data || {};

    return {
      tagName: hashtagInfo.name || hashtag,
      postCount: hashtagInfo.media_count || 0,
    };
  } catch (error) {
    console.error("Error searching hashtag:", error);
    return {
      tagName: hashtag,
      postCount: 0,
    };
  }
}
