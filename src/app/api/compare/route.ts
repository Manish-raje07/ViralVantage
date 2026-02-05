// Compare API Route - Cross-format and platform comparison
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

interface Post {
  id: string;
  platform: string;
  content: string;
  type: string;
  hashtags: string[];
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  publishedAt: Date;
}

interface FormatComparison {
  format: string;
  postsCount: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgReach: number;
  avgEngagementRate: number;
}

type PostType = string;

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('social-media-dashboard');
    
    // Get posts from database
    const posts = await db.collection<Post>('posts').find({}).toArray();
    
    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          comparisons: [],
          chartData: { labels: [], datasets: [] },
          radarData: { labels: [], datasets: [] },
          bestFormat: null,
          insights: ['No posts available for comparison. Add some posts to see analytics.'],
        },
      });
    }
    
    // Group posts by type
    const typeGroups = new Map<PostType, Post[]>();
    for (const post of posts) {
      const group = typeGroups.get(post.type) || [];
      group.push(post);
      typeGroups.set(post.type, group);
    }
    
    // Calculate comparison metrics for each type
    const comparisons: FormatComparison[] = [];
    
    for (const [format, typePosts] of typeGroups.entries()) {
      if (typePosts.length === 0) continue;
      
      const avgLikes = typePosts.reduce((sum, p) => sum + p.likes, 0) / typePosts.length;
      const avgComments = typePosts.reduce((sum, p) => sum + p.comments, 0) / typePosts.length;
      const avgShares = typePosts.reduce((sum, p) => sum + p.shares, 0) / typePosts.length;
      const avgReach = typePosts.reduce((sum, p) => sum + p.reach, 0) / typePosts.length;
      const avgEngagementRate = typePosts.reduce((sum, p) => sum + p.engagementRate, 0) / typePosts.length;
      
      comparisons.push({
        format,
        postsCount: typePosts.length,
        avgLikes: Math.round(avgLikes),
        avgComments: Math.round(avgComments),
        avgShares: Math.round(avgShares),
        avgReach: Math.round(avgReach),
        avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      });
    }
    
    // Sort by engagement rate (best performing first)
    comparisons.sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
    
    // Generate chart data
    const chartData = {
      labels: comparisons.map(c => formatTypeName(c.format)),
      datasets: [
        {
          label: 'Avg Engagement Rate (%)',
          data: comparisons.map(c => c.avgEngagementRate),
          backgroundColor: ['#2563EB', '#60A5FA', '#F43F5E', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
        },
        {
          label: 'Avg Likes',
          data: comparisons.map(c => c.avgLikes),
          backgroundColor: ['#3B82F6', '#93C5FD', '#FB7185', '#34D399', '#FBBF24', '#A78BFA', '#F472B6'],
        },
      ],
    };
    
    // Generate radar chart data
    const radarData = {
      labels: ['Likes', 'Comments', 'Shares', 'Reach', 'Engagement'],
      datasets: comparisons.slice(0, 5).map((c, i) => ({
        label: formatTypeName(c.format),
        data: [
          normalizeValue(c.avgLikes, comparisons.map(x => x.avgLikes)),
          normalizeValue(c.avgComments, comparisons.map(x => x.avgComments)),
          normalizeValue(c.avgShares, comparisons.map(x => x.avgShares)),
          normalizeValue(c.avgReach, comparisons.map(x => x.avgReach)),
          normalizeValue(c.avgEngagementRate, comparisons.map(x => x.avgEngagementRate)),
        ],
        backgroundColor: getRadarColor(i, 0.2),
        borderColor: getRadarColor(i, 1),
      })),
    };
    
    // Find best format
    const bestFormat = comparisons[0];
    
    // Generate insights
    const insights = generateComparisonInsights(comparisons);
    
    // Add platform comparison
    const platformGroups = new Map<string, Post[]>();
    for (const post of posts) {
      const group = platformGroups.get(post.platform) || [];
      group.push(post);
      platformGroups.set(post.platform, group);
    }
    
    const platformComparisons = [];
    for (const [platform, platformPosts] of platformGroups.entries()) {
      if (platformPosts.length === 0) continue;
      platformComparisons.push({
        platform,
        postsCount: platformPosts.length,
        avgEngagement: platformPosts.reduce((sum, p) => sum + p.engagementRate, 0) / platformPosts.length,
        totalLikes: platformPosts.reduce((sum, p) => sum + p.likes, 0),
      });
    }
    platformComparisons.sort((a, b) => b.avgEngagement - a.avgEngagement);
    
    return NextResponse.json({
      success: true,
      data: {
        comparisons,
        chartData,
        radarData,
        platformComparisons,
        bestFormat: bestFormat ? {
          format: bestFormat.format,
          name: formatTypeName(bestFormat.format),
          engagementRate: bestFormat.avgEngagementRate,
          advantage: comparisons.length > 1 
            ? `${Math.round((bestFormat.avgEngagementRate / (comparisons[1]?.avgEngagementRate || 1) - 1) * 100)}% higher than ${formatTypeName(comparisons[1]?.format)}`
            : 'Top performer',
        } : null,
        insights,
      },
    });
  } catch (error) {
    console.error('Compare API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate comparison' },
      { status: 500 }
    );
  }
}

// Helper functions
function formatTypeName(type: PostType | undefined): string {
  if (!type) return 'Unknown';
  const names: Record<string, string> = {
    reel: 'Reels',
    carousel: 'Carousels',
    static: 'Static Posts',
    video: 'Videos',
    text: 'Text Posts',
    story: 'Stories',
    image: 'Images',
    thread: 'Threads',
    short: 'Shorts',
  };
  return names[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

function normalizeValue(value: number, allValues: number[]): number {
  const max = Math.max(...allValues);
  if (max === 0) return 0;
  return Math.round((value / max) * 100);
}

function getRadarColor(index: number, alpha: number): string {
  const colors = [
    `rgba(37, 99, 235, ${alpha})`,   // Blue
    `rgba(244, 63, 94, ${alpha})`,   // Rose
    `rgba(16, 185, 129, ${alpha})`,  // Emerald
    `rgba(245, 158, 11, ${alpha})`,  // Amber
    `rgba(139, 92, 246, ${alpha})`,  // Violet
    `rgba(236, 72, 153, ${alpha})`,  // Pink
    `rgba(6, 182, 212, ${alpha})`,   // Cyan
  ];
  return colors[index % colors.length];
}

function generateComparisonInsights(comparisons: FormatComparison[]) {
  const insights: string[] = [];
  
  if (comparisons.length === 0) return insights;
  
  const best = comparisons[0];
  const worst = comparisons[comparisons.length - 1];
  
  insights.push(
    `**${formatTypeName(best.format)}** are your best performing content type with an average engagement rate of **${best.avgEngagementRate.toFixed(1)}%**.`
  );
  
  if (comparisons.length > 1) {
    const difference = Math.round((best.avgEngagementRate / (worst.avgEngagementRate || 1) - 1) * 100);
    if (difference > 0) {
      insights.push(
        `${formatTypeName(best.format)} outperform ${formatTypeName(worst.format)} by **${difference}%** in engagement.`
      );
    }
  }
  
  // Check if reels/video are top performers
  const videoFormats = comparisons.filter(c => ['reel', 'video', 'short'].includes(c.format));
  if (videoFormats.length > 0 && videoFormats.some(v => comparisons.indexOf(v) < 2)) {
    insights.push(
      `Video content is performing well! Consider creating more Reels, Shorts, and Videos to maximize engagement.`
    );
  }
  
  // Check for image performance
  const imageFormats = comparisons.filter(c => ['image', 'carousel', 'static'].includes(c.format));
  if (imageFormats.length > 0) {
    const avgImageEngagement = imageFormats.reduce((sum, f) => sum + f.avgEngagementRate, 0) / imageFormats.length;
    if (avgImageEngagement > 5) {
      insights.push(
        `Your image-based content averages **${avgImageEngagement.toFixed(1)}%** engagement - keep up the quality visuals!`
      );
    }
  }
  
  // Recommend increasing best format
  insights.push(
    `Consider posting more ${formatTypeName(best.format)} as they generate **${best.avgLikes.toLocaleString()}** likes on average.`
  );
  
  return insights;
}
