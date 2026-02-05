// Reports API Route - Exportable analysis reports
import { NextRequest, NextResponse } from "next/server";
import { getCollection, COLLECTIONS } from "@/lib/mongodb";
import { SocialPost, Insight } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "json";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get posts
    const postsCollection = await getCollection<SocialPost>(COLLECTIONS.POSTS);
    let query = {};

    if (startDate || endDate) {
      query = {
        publishedAt: {
          ...(startDate && { $gte: new Date(startDate) }),
          ...(endDate && { $lte: new Date(endDate) }),
        },
      };
    }

    const posts = await postsCollection
      .find(query)
      .sort({ publishedAt: -1 })
      .toArray();

    if (posts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No posts available for the specified period. Please ensure social media integrations are connected.",
        },
        { status: 400 },
      );
    }

    // Get insights
    const insightsCollection = await getCollection<Insight>(
      COLLECTIONS.INSIGHTS,
    );
    const insights = await insightsCollection
      .find({})
      .sort({ generatedAt: -1 })
      .limit(10)
      .toArray();

    // Build report data
    const reportData = buildReportData(posts, insights);

    if (format === "csv") {
      return generateCSVResponse(reportData);
    }

    // Default to JSON
    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate report" },
      { status: 500 },
    );
  }
}

// Build comprehensive report data
function buildReportData(posts: SocialPost[], insights: Insight[]) {
  const now = new Date();

  // Summary metrics
  const summary = {
    reportGenerated: now.toISOString(),
    dateRange: {
      from: posts.length > 0 ? posts[posts.length - 1].publishedAt : null,
      to: posts.length > 0 ? posts[0].publishedAt : null,
    },
    totalPosts: posts.length,
    totalLikes: posts.reduce((sum, p) => sum + p.metrics.likes, 0),
    totalComments: posts.reduce((sum, p) => sum + p.metrics.comments, 0),
    totalShares: posts.reduce((sum, p) => sum + p.metrics.shares, 0),
    totalReach: posts.reduce((sum, p) => sum + p.metrics.reach, 0),
    avgEngagementRate:
      posts.length > 0
        ? Math.round(
            (posts.reduce((sum, p) => sum + p.metrics.engagementRate, 0) /
              posts.length) *
              100,
          ) / 100
        : 0,
  };

  // Platform breakdown
  const platformBreakdown: Record<
    string,
    {
      posts: number;
      likes: number;
      comments: number;
      shares: number;
      engagement: number;
    }
  > = {};
  for (const post of posts) {
    if (!platformBreakdown[post.platform]) {
      platformBreakdown[post.platform] = {
        posts: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        engagement: 0,
      };
    }
    platformBreakdown[post.platform].posts++;
    platformBreakdown[post.platform].likes += post.metrics.likes;
    platformBreakdown[post.platform].comments += post.metrics.comments;
    platformBreakdown[post.platform].shares += post.metrics.shares;
    platformBreakdown[post.platform].engagement += post.metrics.engagementRate;
  }

  // Content type breakdown
  const typeBreakdown: Record<
    string,
    { posts: number; avgEngagement: number; totalLikes: number }
  > = {};
  for (const post of posts) {
    if (!typeBreakdown[post.type]) {
      typeBreakdown[post.type] = { posts: 0, avgEngagement: 0, totalLikes: 0 };
    }
    typeBreakdown[post.type].posts++;
    typeBreakdown[post.type].avgEngagement += post.metrics.engagementRate;
    typeBreakdown[post.type].totalLikes += post.metrics.likes;
  }

  // Calculate averages for types
  for (const type in typeBreakdown) {
    typeBreakdown[type].avgEngagement =
      Math.round(
        (typeBreakdown[type].avgEngagement / typeBreakdown[type].posts) * 100,
      ) / 100;
  }

  // Top posts
  const topPosts = [...posts]
    .sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate)
    .slice(0, 10)
    .map((p) => ({
      platform: p.platform,
      type: p.type,
      content:
        p.content.substring(0, 100) + (p.content.length > 100 ? "..." : ""),
      likes: p.metrics.likes,
      comments: p.metrics.comments,
      shares: p.metrics.shares,
      reach: p.metrics.reach,
      engagementRate: p.metrics.engagementRate,
      publishedAt: p.publishedAt,
    }));

  // Daily performance
  const dailyPerformance = new Map<
    string,
    { posts: number; engagement: number; reach: number }
  >();
  for (const post of posts) {
    const dateStr = new Date(post.publishedAt).toISOString().split("T")[0];
    const current = dailyPerformance.get(dateStr) || {
      posts: 0,
      engagement: 0,
      reach: 0,
    };
    current.posts++;
    current.engagement +=
      post.metrics.likes + post.metrics.comments + post.metrics.shares;
    current.reach += post.metrics.reach;
    dailyPerformance.set(dateStr, current);
  }

  return {
    summary,
    platformBreakdown,
    typeBreakdown,
    topPosts,
    dailyPerformance: Array.from(dailyPerformance.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    insights: insights.map((i) => ({
      type: i.type,
      title: i.title,
      content: i.content,
      priority: i.priority,
    })),
    allPosts: posts.map((p) => ({
      platform: p.platform,
      type: p.type,
      content: p.content,
      likes: p.metrics.likes,
      comments: p.metrics.comments,
      shares: p.metrics.shares,
      reach: p.metrics.reach,
      impressions: p.metrics.impressions,
      engagementRate: p.metrics.engagementRate,
      publishedAt: p.publishedAt,
      hashtags: p.hashtags.join(", "),
    })),
  };
}

// Generate CSV response
function generateCSVResponse(reportData: ReturnType<typeof buildReportData>) {
  const rows: string[] = [];

  // Header
  rows.push(
    "Platform,Type,Content,Likes,Comments,Shares,Reach,Impressions,Engagement Rate,Published At,Hashtags",
  );

  // Data rows
  for (const post of reportData.allPosts) {
    const content = post.content.replace(/"/g, '""').replace(/[\n\r]/g, " ");
    rows.push(
      `"${post.platform}","${post.type}","${content}",${post.likes},${post.comments},${post.shares},${post.reach},${post.impressions},${post.engagementRate},"${post.publishedAt}","${post.hashtags}"`,
    );
  }

  const csv = rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="social-analytics-report-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
