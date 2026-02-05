// Social Media Analytics Dashboard - TypeScript Interfaces

// Platform types - All supported social media platforms
export type Platform = 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'reddit' | 'pinterest';
export type PostType = 'reel' | 'carousel' | 'static' | 'video' | 'text' | 'story' | 'image' | 'thread' | 'short';

// Platform metadata
export interface PlatformMetrics {
  platform: Platform;
  followers: number;
  following: number;
  posts: number;
  engagement: number;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  profileViews: number;
  websiteClicks: number;
  growthRate: number;
  icon: string;
  color: string;
  username: string;
  verified: boolean;
  lastUpdated: Date;
}

// Audience demographics
export interface AudienceData {
  platform: Platform;
  demographics: {
    age: { range: string; percentage: number }[];
    gender: { type: string; percentage: number }[];
    locations: { country: string; city?: string; percentage: number }[];
  };
  interests: { name: string; percentage: number }[];
  activeHours: { hour: number; engagement: number }[];
  activeDays: { day: string; engagement: number }[];
}

// Daily metrics for time series
export interface DailyMetric {
  date: Date;
  platform: Platform;
  followers: number;
  engagement: number;
  reach: number;
  impressions: number;
  posts: number;
}


// Post metrics interface
export interface PostMetrics {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  saves?: number;
  engagementRate: number;
}

// Social media post interface
export interface SocialPost {
  _id?: string;
  platform: Platform;
  postId: string;
  type: PostType;
  content: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  publishedAt: Date;
  metrics: PostMetrics;
  hashtags: string[];
  mentions: string[];
  syncedAt: Date;
}

// Aggregated analytics snapshot
export interface AnalyticsSnapshot {
  _id?: string;
  platform: Platform;
  date: Date;
  metrics: {
    totalFollowers: number;
    followerGrowth: number;
    totalEngagement: number;
    avgEngagementRate: number;
    topPostId?: string;
    postsCount: number;
  };
}

// AI-generated insight
export interface Insight {
  _id?: string;
  type: 'best_time' | 'content_type' | 'viral_factor' | 'recommendation' | 'trend';
  title: string;
  content: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  generatedAt: Date;
  validUntil: Date;
}

// AI query and response
export interface AIQuery {
  _id?: string;
  query: string;
  response: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}

// Cross-format comparison data
export interface FormatComparison {
  format: PostType;
  postsCount: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgReach: number;
  avgEngagementRate: number;
  bestPerformingPost?: SocialPost;
}

// Dashboard overview data
export interface DashboardData {
  totalFollowers: number;
  followerGrowth: number;
  totalPosts: number;
  totalEngagement: number;
  avgEngagementRate: number;
  platformBreakdown: {
    platform: Platform;
    followers: number;
    posts: number;
    engagement: number;
  }[];
  recentPosts: SocialPost[];
  topPosts: SocialPost[];
  insights: Insight[];
}

// Time-series data point
export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

// Chart data structure
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    fill?: boolean;
  }[];
}

// Best posting time analysis
export interface BestPostingTime {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  avgEngagement: number;
  postsCount: number;
}

// Report configuration
export interface ReportConfig {
  startDate: Date;
  endDate: Date;
  platforms: Platform[];
  includeCharts: boolean;
  includeInsights: boolean;
  format: 'pdf' | 'csv';
}

// API Response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
