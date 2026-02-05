// AI Query API Route - Natural language query interface
import { NextRequest, NextResponse } from "next/server";
import { queryAnalytics } from "@/lib/gemini";
import { getCollection, COLLECTIONS } from "@/lib/mongodb";
import { SocialPost, AIQuery } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 },
      );
    }

    // Get analytics context from database or sample data
    const postsCollection = await getCollection<SocialPost>(COLLECTIONS.POSTS);
    const posts = await postsCollection
      .find({})
      .sort({ publishedAt: -1 })
      .limit(50)
      .toArray();

    if (posts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No posts available. Please ensure social media integrations are connected.",
        },
        { status: 400 },
      );
    }

    // Build context for AI
    const analyticsContext = buildAnalyticsContext(posts);

    // Query Gemini AI
    const response = await queryAnalytics(query, analyticsContext);

    // Save query to history
    try {
      const queriesCollection = await getCollection<AIQuery>(
        COLLECTIONS.QUERIES,
      );
      await queriesCollection.insertOne({
        query,
        response,
        timestamp: new Date(),
      } as AIQuery);
    } catch {
      // Non-critical - continue even if save fails
      console.warn("Failed to save query to history");
    }

    return NextResponse.json({
      success: true,
      data: {
        query,
        response,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("AI Query API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process query" },
      { status: 500 },
    );
  }
}

// Get query history
export async function GET() {
  try {
    const queriesCollection = await getCollection<AIQuery>(COLLECTIONS.QUERIES);
    const queries = await queriesCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({
      success: true,
      data: queries,
    });
  } catch (error) {
    console.error("AI Query history error:", error);
    return NextResponse.json({
      success: true,
      data: [], // Return empty array on error
    });
  }
}

// Build analytics context for AI
function buildAnalyticsContext(posts: SocialPost[]) {
  // Calculate totals
  const totalLikes = posts.reduce((sum, p) => sum + p.metrics.likes, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.metrics.comments, 0);
  const totalShares = posts.reduce((sum, p) => sum + p.metrics.shares, 0);
  const totalReach = posts.reduce((sum, p) => sum + p.metrics.reach, 0);
  const avgEngagementRate =
    posts.reduce((sum, p) => sum + p.metrics.engagementRate, 0) / posts.length;

  // Group by platform
  const byPlatform = new Map<string, { posts: number; engagement: number }>();
  for (const post of posts) {
    const current = byPlatform.get(post.platform) || {
      posts: 0,
      engagement: 0,
    };
    current.posts++;
    current.engagement +=
      post.metrics.likes + post.metrics.comments + post.metrics.shares;
    byPlatform.set(post.platform, current);
  }

  // Group by post type
  const byType = new Map<
    string,
    { posts: number; avgEngagement: number; totalEngagement: number }
  >();
  for (const post of posts) {
    const current = byType.get(post.type) || {
      posts: 0,
      avgEngagement: 0,
      totalEngagement: 0,
    };
    current.posts++;
    current.totalEngagement +=
      post.metrics.likes + post.metrics.comments + post.metrics.shares;
    byType.set(post.type, current);
  }

  // Calculate averages for types
  for (const [type, data] of byType.entries()) {
    data.avgEngagement = Math.round(data.totalEngagement / data.posts);
    byType.set(type, data);
  }

  // Find top performing posts
  const topPosts = [...posts]
    .sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate)
    .slice(0, 5)
    .map((p) => ({
      type: p.type,
      platform: p.platform,
      content: p.content.substring(0, 100),
      likes: p.metrics.likes,
      comments: p.metrics.comments,
      shares: p.metrics.shares,
      engagementRate: p.metrics.engagementRate,
      publishedAt: p.publishedAt,
    }));

  // Find best posting times
  const hourlyEngagement = new Array(24)
    .fill(0)
    .map(() => ({ total: 0, count: 0 }));
  for (const post of posts) {
    const hour = new Date(post.publishedAt).getHours();
    hourlyEngagement[hour].total += post.metrics.likes + post.metrics.comments;
    hourlyEngagement[hour].count++;
  }

  const bestHours = hourlyEngagement
    .map((h, i) => ({
      hour: i,
      avgEngagement: h.count > 0 ? h.total / h.count : 0,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 3);

  return {
    summary: {
      totalPosts: posts.length,
      totalLikes,
      totalComments,
      totalShares,
      totalReach,
      avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
    },
    platformBreakdown: Object.fromEntries(byPlatform),
    contentTypeBreakdown: Object.fromEntries(byType),
    topPerformingPosts: topPosts,
    bestPostingHours: bestHours,
    dateRange: {
      from: posts.length > 0 ? posts[posts.length - 1].publishedAt : null,
      to: posts.length > 0 ? posts[0].publishedAt : null,
    },
  };
}
