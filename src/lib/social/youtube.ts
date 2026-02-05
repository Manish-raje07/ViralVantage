import { SocialPost, PostMetrics, Platform } from "@/types";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

interface YouTubeChannelStats {
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
}

interface YouTubeVideoItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      high: { url: string };
      medium: { url: string };
    };
  };
}

interface YouTubeVideo {
  id: string;
  snippet: {
    publishedAt: string;
    title: string;
    description: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
    };
  };
  statistics: {
    viewCount: number;
    likeCount?: number;
    commentCount?: number;
  };
}

export async function getChannelStats(
  apiKey: string,
  channelId: string,
): Promise<{
  followers: number;
  views: number;
  videoCount: number;
}> {
  try {
    const url = `${YOUTUBE_API_BASE}/channels?part=statistics&id=${channelId}&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    const stats: YouTubeChannelStats = data.items?.[0]?.statistics;

    if (!stats) {
      // Return zeros if channel not found or stats hidden
      return { followers: 0, views: 0, videoCount: 0 };
    }

    return {
      followers: parseInt(stats.subscriberCount, 10) || 0,
      views: parseInt(stats.viewCount, 10) || 0,
      videoCount: parseInt(stats.videoCount, 10) || 0,
    };
  } catch (error) {
    console.error("Error fetching YouTube channel stats:", error);
    return { followers: 0, views: 0, videoCount: 0 };
  }
}

export async function getRecentVideos(
  apiKey: string,
  channelId: string,
  limit: number = 10,
): Promise<SocialPost[]> {
  try {
    const url = `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&maxResults=${limit}&order=date&type=video&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    const posts: SocialPost[] = [];

    for (const item of data.items || []) {
      posts.push(transformYouTubeVideo(item));
    }

    return posts;
  } catch (error) {
export async function getChannelVideos(
  channelId: string,
  limit: number = 25
): Promise<SocialPost[]> {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('Missing YouTube API key');
    }

    // First, get uploads playlist ID
    const channelResponse = await fetch(
      `${YOUTUBE_API_BASE}/channels?id=${channelId}&part=contentDetails&key=${YOUTUBE_API_KEY}`
    );

    if (!channelResponse.ok) {
      throw new Error(`YouTube API error: ${channelResponse.status}`);
    }

    const channelData = await channelResponse.json();
    const uploadsPlaylistId =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      throw new Error('Could not find uploads playlist');
    }

    // Get videos from uploads playlist
    const videosResponse = await fetch(
      `${YOUTUBE_API_BASE}/playlistItems?playlistId=${uploadsPlaylistId}&part=snippet&maxResults=${limit}&key=${YOUTUBE_API_KEY}`
    );

    if (!videosResponse.ok) {
      throw new Error(`YouTube API error: ${videosResponse.status}`);
    }

    const videosData = await videosResponse.json();
    const videoIds = videosData.items
      ?.map((item: any) => item.snippet.resourceId.videoId)
      .join(',');

    if (!videoIds) {
      return [];
    }

    // Get video statistics
    const statsResponse = await fetch(
      `${YOUTUBE_API_BASE}/videos?id=${videoIds}&part=snippet,statistics&key=${YOUTUBE_API_KEY}`
    );

    if (!statsResponse.ok) {
      throw new Error(`YouTube API error: ${statsResponse.status}`);
    }

    const statsData = await statsResponse.json();
    const videos = (statsData.items || []) as YouTubeVideo[];

    return videos.map((video) => transformYouTubeVideoWithStats(video));
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw error;
  }
}

function transformYouTubeVideoWithStats(video: YouTubeVideo): SocialPost {
  const views = parseInt(String(video.statistics?.viewCount || '0'), 10);
  const likes = parseInt(String(video.statistics?.likeCount || '0'), 10);
  const comments = parseInt(String(video.statistics?.commentCount || '0'), 10);

  // Estimate engagement rate
  const engagement = likes + comments;
  const engagementRate = views > 0 ? (engagement / views) * 100 : 0;

  const postMetrics: PostMetrics = {
    likes,
    comments,
    shares: 0,
    reach: views,
    impressions: views,
    engagementRate: Math.round(engagementRate * 100) / 100,
  };

  // Extract hashtags from description
  const hashtags = (video.snippet.description?.match(/#\w+/g) || []).map(
    (tag) => tag.substring(1)
  );

  // Extract mentions from description
  const mentions = (video.snippet.description?.match(/@\w+/g) || []).map(
    (mention) => mention.substring(1)
  );

  return {
    platform: 'youtube' as Platform,
    postId: video.id,
    type: 'video',
    content: video.snippet.title,
    mediaUrl: `https://www.youtube.com/watch?v=${video.id}`,
    thumbnailUrl:
      video.snippet.thumbnails.high?.url ||
      video.snippet.thumbnails.medium?.url,
    publishedAt: new Date(video.snippet.publishedAt),
    metrics: postMetrics,
    hashtags,
    mentions,
    syncedAt: new Date(),
  };
}

/**
 * Get YouTube channel metrics using env API key
 */
export async function getChannelMetrics(channelId: string): Promise<{
  subscribers: number;
  totalViews: number;
  totalVideos: number;
}> {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('Missing YouTube API key');
    }

    const response = await fetch(
      `${YOUTUBE_API_BASE}/channels?id=${channelId}&part=statistics&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    const stats = data.items?.[0]?.statistics || {};

    return {
      subscribers: parseInt(stats.subscriberCount || '0', 10),
      totalViews: parseInt(stats.viewCount || '0', 10),
      totalVideos: parseInt(stats.videoCount || '0', 10),
    };
  } catch (error) {
    console.error('Error fetching channel metrics:', error);
    return {
      subscribers: 0,
      totalViews: 0,
      totalVideos: 0,
    };
  }
}

function transformYouTubeVideo(item: YouTubeVideoItem): SocialPost {
  // YouTube Data API search endpoint doesn't return view/like counts per video directly in the snippet.
  // We would need a second call to 'videos' endpoint to get those metrics.
  // For this MVP, we will simulate the per-video engagement metrics or set them to 0/estimated to avoid quota depletion for now.
  // Or we could do a follow-up fetch (batch) if strict accuracy is needed.
  // Let's stick to basic structure first.

  const metrics: PostMetrics = {
    likes: 0, // Requires extra API call
    comments: 0,
    shares: 0,
    reach: 0,
    impressions: 0,
    engagementRate: 0,
  };

  return {
    platform: "youtube" as Platform,
    postId: item.id.videoId,
    type: "video",
    content: item.snippet.title, // Title as content
    mediaUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    thumbnailUrl:
      item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
    publishedAt: new Date(item.snippet.publishedAt),
    metrics,
    hashtags: [],
    mentions: [],
    syncedAt: new Date(),
  };
}
