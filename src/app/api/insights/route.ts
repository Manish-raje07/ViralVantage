// Insights API Route - AI-powered insights from real data
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { generateInsights } from '@/lib/gemini';

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

interface PlatformMetrics {
  platform: string;
  followers: number;
  engagement: number;
  reach: number;
  impressions: number;
  growthRate: number;
}

interface Insight {
  type: string;
  title: string;
  content: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  generatedAt: Date;
  validUntil: Date;
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('social-media-dashboard');

    // Check for cached valid insights first
    const cachedInsights = await db.collection<Insight>('insights')
      .find({ validUntil: { $gt: new Date() } })
      .sort({ generatedAt: -1 })
      .limit(6)
      .toArray();
    
    if (cachedInsights.length >= 5) {
      return NextResponse.json({
        success: true,
        data: {
          insights: cachedInsights,
          source: 'cache',
          generatedAt: cachedInsights[0]?.generatedAt?.toISOString(),
        },
      });
    }
    
    // Get real data from MongoDB
    const [platforms, posts] = await Promise.all([
      db.collection<PlatformMetrics>('platforms').find({}).toArray(),
      db.collection<Post>('posts').find({}).sort({ publishedAt: -1 }).limit(100).toArray(),
    ]);
    
    if (posts.length === 0 || platforms.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          insights: generateFallbackInsights(),
          source: 'fallback',
        },
      });
    }
    
    // Build analytics data for insight generation
    const analyticsData = buildAnalyticsDataForInsights(posts, platforms);
    
    // Generate insights using Gemini AI
    let aiInsights;
    try {
      aiInsights = await generateInsights(analyticsData);
    } catch (error) {
      console.error('AI generation failed:', error);
      // Generate data-driven insights without AI
      aiInsights = { insights: generateDataDrivenInsights(analyticsData) };
    }
    
    // Transform and save insights
    const now = new Date();
    const validUntil = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours
    
    const formattedInsights: Insight[] = aiInsights.insights.map((insight: { type: string; title: string; content: string; priority: 'high' | 'medium' | 'low'; actionable: boolean }) => ({
      type: insight.type,
      title: insight.title,
      content: insight.content,
      confidence: 0.85,
      priority: insight.priority,
      actionable: insight.actionable,
      generatedAt: now,
      validUntil,
    }));
    
    // Add best posting time analysis
    const bestTimesInsight = generateBestTimesInsight(posts);
    if (bestTimesInsight) {
      formattedInsights.unshift(bestTimesInsight);
    }

    // Add platform-specific insights
    const platformInsights = generatePlatformInsights(platforms);
    formattedInsights.push(...platformInsights);
    
    // Save to database (non-blocking)
    try {
      if (formattedInsights.length > 0) {
        await db.collection('insights').deleteMany({});
        await db.collection('insights').insertMany(formattedInsights);
      }
    } catch {
      console.warn('Failed to cache insights');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        insights: formattedInsights.slice(0, 8),
        source: 'fresh',
        generatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Insights API error:', error);
    
    // Return fallback insights on error
    return NextResponse.json({
      success: true,
      data: {
        insights: generateFallbackInsights(),
        source: 'fallback',
      },
    });
  }
}

// Force regenerate insights
export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db('social-media-dashboard');
    
    // Clear cached insights
    await db.collection('insights').deleteMany({});
    
    // Call GET to regenerate
    return GET();
  } catch (error) {
    console.error('Insights regeneration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to regenerate insights' },
      { status: 500 }
    );
  }
}

// Build analytics data for AI insight generation
function buildAnalyticsDataForInsights(posts: Post[], platforms: PlatformMetrics[]) {
  // Group by platform
  const byPlatform = new Map<string, { count: number; totalEngagement: number; avgEngagement: number }>();
  for (const post of posts) {
    const current = byPlatform.get(post.platform) || { count: 0, totalEngagement: 0, avgEngagement: 0 };
    current.count++;
    current.totalEngagement += post.likes + post.comments + post.shares;
    byPlatform.set(post.platform, current);
  }
  
  // Group by type
  const byType = new Map<string, { count: number; totalEngagement: number; avgEngagement: number }>();
  for (const post of posts) {
    const current = byType.get(post.type) || { count: 0, totalEngagement: 0, avgEngagement: 0 };
    current.count++;
    current.totalEngagement += post.likes + post.comments + post.shares;
    byType.set(post.type, current);
  }
  
  // Calculate averages
  for (const [type, data] of byType.entries()) {
    data.avgEngagement = Math.round(data.totalEngagement / data.count);
    byType.set(type, data);
  }
  
  // Group by hour
  const byHour = new Array(24).fill(0).map(() => ({ count: 0, totalEngagement: 0 }));
  for (const post of posts) {
    const hour = new Date(post.publishedAt).getHours();
    byHour[hour].count++;
    byHour[hour].totalEngagement += post.likes + post.comments;
  }
  
  // Group by day of week
  const byDay = new Array(7).fill(0).map(() => ({ count: 0, totalEngagement: 0 }));
  for (const post of posts) {
    const day = new Date(post.publishedAt).getDay();
    byDay[day].count++;
    byDay[day].totalEngagement += post.likes + post.comments;
  }
  
  // Top hashtags
  const hashtagCounts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.hashtags || []) {
      hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
    }
  }
  const topHashtags = [...hashtagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  // Platform summary
  const totalFollowers = platforms.reduce((sum, p) => sum + p.followers, 0);
  const avgEngagement = platforms.length > 0 
    ? platforms.reduce((sum, p) => sum + p.engagement, 0) / platforms.length 
    : 0;
  
  return {
    totalPosts: posts.length,
    totalFollowers,
    avgEngagementRate: avgEngagement,
    platforms: platforms.map(p => ({
      name: p.platform,
      followers: p.followers,
      engagement: p.engagement,
      growthRate: p.growthRate,
    })),
    contentTypePerformance: Object.fromEntries(byType),
    platformPerformance: Object.fromEntries(byPlatform),
    hourlyPerformance: byHour.map((h, i) => ({
      hour: i,
      avgEngagement: h.count > 0 ? Math.round(h.totalEngagement / h.count) : 0,
      postCount: h.count,
    })),
    dailyPerformance: byDay.map((d, i) => ({
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
      avgEngagement: d.count > 0 ? Math.round(d.totalEngagement / d.count) : 0,
      postCount: d.count,
    })),
    topHashtags: topHashtags.map(([tag, count]) => ({ tag, count })),
    topPosts: posts
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 5)
      .map(p => ({
        platform: p.platform,
        type: p.type,
        engagementRate: p.engagementRate,
        likes: p.likes,
        content: p.content.substring(0, 100),
      })),
  };
}

// Generate data-driven insights without AI
function generateDataDrivenInsights(data: ReturnType<typeof buildAnalyticsDataForInsights>) {
  const insights = [];
  
  // Best performing platform
  const sortedPlatforms = [...data.platforms].sort((a, b) => b.engagement - a.engagement);
  if (sortedPlatforms.length > 0) {
    const best = sortedPlatforms[0];
    insights.push({
      type: 'trend',
      title: `${best.name.charAt(0).toUpperCase() + best.name.slice(1)} is Your Top Platform`,
      content: `With **${best.engagement.toFixed(1)}% engagement rate** and **${best.followers.toLocaleString()} followers**, ${best.name} is your best performing platform. Consider investing more content here.`,
      priority: 'high' as const,
      actionable: true,
    });
  }
  
  // Growing platforms
  const growingPlatforms = data.platforms.filter(p => p.growthRate > 3);
  if (growingPlatforms.length > 0) {
    const fastest = growingPlatforms.sort((a, b) => b.growthRate - a.growthRate)[0];
    insights.push({
      type: 'trend',
      title: 'Rapid Growth Detected',
      content: `Your **${fastest.name}** account is growing at **${fastest.growthRate.toFixed(1)}%**. This is a great opportunity to double down on content here.`,
      priority: 'high' as const,
      actionable: true,
    });
  }
  
  // Content type recommendation
  const contentTypes = Object.entries(data.contentTypePerformance);
  if (contentTypes.length > 0) {
    const bestContent = contentTypes.sort((a, b) => (b[1] as { avgEngagement: number }).avgEngagement - (a[1] as { avgEngagement: number }).avgEngagement)[0];
    insights.push({
      type: 'content_type',
      title: `${bestContent[0].charAt(0).toUpperCase() + bestContent[0].slice(1)} Content Works Best`,
      content: `Your **${bestContent[0]}** posts get the highest engagement. Consider creating more of this content type for better results.`,
      priority: 'medium' as const,
      actionable: true,
    });
  }
  
  // Top hashtags insight
  if (data.topHashtags.length > 0) {
    const topTags = data.topHashtags.slice(0, 3).map(t => t.tag).join(', ');
    insights.push({
      type: 'recommendation',
      title: 'Your Best Hashtags',
      content: `Your most effective hashtags are: **${topTags}**. Continue using these to maximize reach and discoverability.`,
      priority: 'medium' as const,
      actionable: true,
    });
  }
  
  // Engagement rate insight
  if (data.avgEngagementRate > 0) {
    const status = data.avgEngagementRate > 5 ? 'excellent' : data.avgEngagementRate > 3 ? 'good' : 'needs improvement';
    insights.push({
      type: 'recommendation',
      title: `Engagement Rate: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      content: `Your average engagement rate is **${data.avgEngagementRate.toFixed(1)}%**. ${data.avgEngagementRate > 3 ? 'Keep up the great work!' : 'Try more engaging content like videos and polls.'}`,
      priority: data.avgEngagementRate > 3 ? 'low' as const : 'high' as const,
      actionable: data.avgEngagementRate < 3,
    });
  }
  
  return insights;
}

// Generate platform-specific insights
function generatePlatformInsights(platforms: PlatformMetrics[]): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const validUntil = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  
  // Find underperforming platforms
  const avgEngagement = platforms.reduce((sum, p) => sum + p.engagement, 0) / platforms.length;
  const underperforming = platforms.filter(p => p.engagement < avgEngagement * 0.7);
  
  for (const platform of underperforming.slice(0, 2)) {
    insights.push({
      type: 'recommendation',
      title: `Improve ${platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)} Performance`,
      content: `Your ${platform.platform} engagement (${platform.engagement.toFixed(1)}%) is below average. Try posting more interactive content like polls, questions, and behind-the-scenes content.`,
      confidence: 0.8,
      priority: 'medium',
      actionable: true,
      generatedAt: now,
      validUntil,
    });
  }
  
  return insights;
}

// Generate best posting time insight
function generateBestTimesInsight(posts: Post[]): Insight | null {
  if (posts.length < 5) return null;
  
  const hourlyData = new Array(24).fill(0).map(() => ({ total: 0, count: 0 }));
  
  for (const post of posts) {
    const hour = new Date(post.publishedAt).getHours();
    hourlyData[hour].total += post.engagementRate;
    hourlyData[hour].count++;
  }
  
  const hourlyAvg = hourlyData.map((h, i) => ({
    hour: i,
    avg: h.count > 0 ? h.total / h.count : 0,
  }));
  
  const sortedHours = [...hourlyAvg].sort((a, b) => b.avg - a.avg);
  const bestHours = sortedHours.slice(0, 3).filter(h => h.avg > 0);
  
  if (bestHours.length === 0) return null;
  
  const formatHour = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:00 ${ampm}`;
  };
  
  return {
    type: 'best_time',
    title: 'Optimal Posting Times',
    content: `Your posts perform best at **${formatHour(bestHours[0].hour)}** with ${bestHours[0].avg.toFixed(1)}% average engagement. Other effective times: ${bestHours.slice(1).map(h => formatHour(h.hour)).join(' and ')}.`,
    confidence: 0.9,
    priority: 'high',
    actionable: true,
    generatedAt: new Date(),
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

// Fallback insights when AI fails
function generateFallbackInsights(): Insight[] {
  const now = new Date();
  const validUntil = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  
  return [
    {
      type: 'recommendation',
      title: 'Consistency is Key',
      content: 'Post regularly at the same times each day to build audience expectations and improve engagement.',
      confidence: 0.95,
      priority: 'high',
      actionable: true,
      generatedAt: now,
      validUntil,
    },
    {
      type: 'content_type',
      title: 'Video Content Performs Best',
      content: 'Industry data shows **Reels** and **video content** typically get 2-3x more engagement than static posts.',
      confidence: 0.85,
      priority: 'medium',
      actionable: true,
      generatedAt: now,
      validUntil,
    },
    {
      type: 'trend',
      title: 'Engage With Your Audience',
      content: 'Respond to comments within the **first hour** to boost post visibility in the algorithm.',
      confidence: 0.9,
      priority: 'high',
      actionable: true,
      generatedAt: now,
      validUntil,
    },
    {
      type: 'recommendation',
      title: 'Cross-Platform Strategy',
      content: 'Repurpose your top-performing content across platforms. A viral TikTok can become an Instagram Reel and YouTube Short.',
      confidence: 0.85,
      priority: 'medium',
      actionable: true,
      generatedAt: now,
      validUntil,
    },
  ];
}
