// Instagram API wrapper using Meta Graph API
// Documentation: https://developers.facebook.com/docs/instagram-api/

import { SocialPost, PostMetrics, Platform } from '@/types';

const INSTAGRAM_API_BASE = 'https://graph.facebook.com/v18.0';

interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  timestamp: string;
  permalink: string;
  like_count?: number;
  comments_count?: number;
}

interface InstagramInsights {
  impressions: number;
  reach: number;
  saved?: number;
  shares?: number;
  engagement: number;
}

// Get user's Instagram media
export async function getInstagramMedia(
  accessToken: string,
  userId: string = 'me',
  limit: number = 25
): Promise<SocialPost[]> {
  try {
    const url = `${INSTAGRAM_API_BASE}/${userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,like_count,comments_count&limit=${limit}&access_token=${accessToken}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }
    
    const data = await response.json();
    const posts: SocialPost[] = [];
    
    for (const item of data.data || []) {
      const post = await transformInstagramPost(item, accessToken);
      posts.push(post);
    }
    
    return posts;
  } catch (error) {
    console.error('Error fetching Instagram media:', error);
    throw error;
  }
}

// Get insights for a specific media item
export async function getMediaInsights(
  mediaId: string,
  accessToken: string
): Promise<InstagramInsights> {
  try {
    const url = `${INSTAGRAM_API_BASE}/${mediaId}/insights?metric=impressions,reach,saved,shares,engagement&access_token=${accessToken}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      // Return default values if insights not available
      return {
        impressions: 0,
        reach: 0,
        saved: 0,
        shares: 0,
        engagement: 0,
      };
    }
    
    const data = await response.json();
    const insights: InstagramInsights = {
      impressions: 0,
      reach: 0,
      saved: 0,
      shares: 0,
      engagement: 0,
    };
    
    for (const metric of data.data || []) {
      const value = metric.values?.[0]?.value || 0;
      switch (metric.name) {
        case 'impressions':
          insights.impressions = value;
          break;
        case 'reach':
          insights.reach = value;
          break;
        case 'saved':
          insights.saved = value;
          break;
        case 'shares':
          insights.shares = value;
          break;
        case 'engagement':
          insights.engagement = value;
          break;
      }
    }
    
    return insights;
  } catch (error) {
    console.error('Error fetching media insights:', error);
    return {
      impressions: 0,
      reach: 0,
      saved: 0,
      shares: 0,
      engagement: 0,
    };
  }
}

// Get account insights
export async function getAccountInsights(
  accessToken: string,
  userId: string = 'me'
): Promise<{
  followers: number;
  followersGrowth: number;
  profileViews: number;
  websiteClicks: number;
}> {
  try {
    const url = `${INSTAGRAM_API_BASE}/${userId}?fields=followers_count,media_count&access_token=${accessToken}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      followers: data.followers_count || 0,
      followersGrowth: 0, // Would need historical data
      profileViews: 0,
      websiteClicks: 0,
    };
  } catch (error) {
    console.error('Error fetching account insights:', error);
    return {
      followers: 0,
      followersGrowth: 0,
      profileViews: 0,
      websiteClicks: 0,
    };
  }
}

// Transform Instagram API response to our SocialPost format
async function transformInstagramPost(
  item: InstagramMediaItem,
  accessToken: string
): Promise<SocialPost> {
  const insights = await getMediaInsights(item.id, accessToken);
  
  // Determine post type
  let postType: SocialPost['type'] = 'static';
  switch (item.media_type) {
    case 'VIDEO':
      postType = 'reel'; // Simplified - could be reel or video
      break;
    case 'CAROUSEL_ALBUM':
      postType = 'carousel';
      break;
    case 'IMAGE':
    default:
      postType = 'static';
  }
  
  // Extract hashtags from caption
  const hashtags = item.caption?.match(/#\w+/g)?.map(tag => tag.slice(1)) || [];
  
  // Extract mentions from caption
  const mentions = item.caption?.match(/@\w+/g)?.map(mention => mention.slice(1)) || [];
  
  // Calculate engagement rate
  const totalEngagement = (item.like_count || 0) + (item.comments_count || 0) + (insights.shares || 0) + (insights.saved || 0);
  const reach = insights.reach || insights.impressions || 1;
  const engagementRate = (totalEngagement / reach) * 100;
  
  const metrics: PostMetrics = {
    likes: item.like_count || 0,
    comments: item.comments_count || 0,
    shares: insights.shares || 0,
    reach: insights.reach || 0,
    impressions: insights.impressions || 0,
    saves: insights.saved || 0,
    engagementRate: Math.round(engagementRate * 100) / 100,
  };
  
  return {
    platform: 'instagram' as Platform,
    postId: item.id,
    type: postType,
    content: item.caption || '',
    mediaUrl: item.media_url,
    thumbnailUrl: item.thumbnail_url,
    publishedAt: new Date(item.timestamp),
    metrics,
    hashtags,
    mentions,
    syncedAt: new Date(),
  };
}

// Generate sample data for demo (when API credentials not available)
export function generateSampleInstagramData(): SocialPost[] {
  const postTypes: SocialPost['type'][] = ['reel', 'carousel', 'static', 'reel', 'static'];
  const posts: SocialPost[] = [];
  
  for (let i = 0; i < 20; i++) {
    const type = postTypes[i % postTypes.length];
    const isReel = type === 'reel';
    const isCarousel = type === 'carousel';
    
    // Reels typically get higher engagement
    const baseMultiplier = isReel ? 2.5 : isCarousel ? 1.5 : 1;
    const randomFactor = 0.5 + Math.random();
    
    const likes = Math.floor(500 * baseMultiplier * randomFactor + Math.random() * 1000);
    const comments = Math.floor(likes * 0.03 * randomFactor);
    const shares = Math.floor(likes * 0.02 * randomFactor);
    const saves = Math.floor(likes * 0.05 * randomFactor);
    const reach = Math.floor(likes * 8 * randomFactor);
    const impressions = Math.floor(reach * 1.3);
    const engagementRate = ((likes + comments + shares + saves) / reach) * 100;
    
    const daysAgo = Math.floor(Math.random() * 30);
    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - daysAgo);
    
    posts.push({
      platform: 'instagram',
      postId: `ig_${Date.now()}_${i}`,
      type,
      content: `Sample ${type} post #${i + 1} with engaging content #socialmedia #analytics #growth`,
      mediaUrl: `https://picsum.photos/seed/${i}/800/800`,
      thumbnailUrl: `https://picsum.photos/seed/${i}/400/400`,
      publishedAt,
      metrics: {
        likes,
        comments,
        shares,
        reach,
        impressions,
        saves,
        engagementRate: Math.round(engagementRate * 100) / 100,
      },
      hashtags: ['socialmedia', 'analytics', 'growth', 'content'],
      mentions: [],
      syncedAt: new Date(),
    });
  }
  
  return posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}
