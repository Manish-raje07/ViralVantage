import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Platform, PlatformMetrics, DailyMetric, AudienceData } from "@/types";
import {
  getUserTweets as getTwitterPosts,
  getUserProfile as getTwitterProfile,
} from "@/lib/social/twitter-rapidapi";
import {
  getInstagramPosts,
  getInstagramProfile,
} from "@/lib/social/instagram-rapidapi";
import { getChannelVideos, getChannelMetrics } from "@/lib/social/youtube";

// Platform icon mapping for Lucide icons
const platformIcons: Record<string, string> = {
  instagram: "Instagram",
  twitter: "Twitter",
  facebook: "Facebook",
  youtube: "Youtube",
  linkedin: "Linkedin",
  tiktok: "Music2",
  reddit: "MessageCircle",
  pinterest: "Pin",
};

const platformColors: Record<string, string> = {
  instagram: "#E4405F",
  twitter: "#1DA1F2",
  facebook: "#1877F2",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
  tiktok: "#000000",
  reddit: "#FF4500",
  pinterest: "#BD081C",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform") as Platform | null;
    const period = searchParams.get("period") || "30"; // days
    const type = searchParams.get("type") || "overview"; // overview, platforms, posts, audience, trends

    const client = await clientPromise;
    const db = client.db("social-media-dashboard");

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Build query filter
    const platformFilter = platform ? { platform } : {};
    const dateFilter = { date: { $gte: startDate, $lte: endDate } };

    if (type === "overview") {
      // Get all platform metrics
      const platforms = await db
        .collection<PlatformMetrics>("platforms")
        .find(platformFilter)
        .toArray();

      // Calculate totals
      const totalFollowers = platforms.reduce((sum, p) => sum + p.followers, 0);
      const totalReach = platforms.reduce((sum, p) => sum + p.reach, 0);
      const totalImpressions = platforms.reduce(
        (sum, p) => sum + p.impressions,
        0,
      );
      const totalLikes = platforms.reduce((sum, p) => sum + p.likes, 0);
      const totalComments = platforms.reduce((sum, p) => sum + p.comments, 0);
      const totalShares = platforms.reduce((sum, p) => sum + p.shares, 0);
      const avgEngagement =
        platforms.length > 0
          ? platforms.reduce((sum, p) => sum + p.engagement, 0) /
            platforms.length
          : 0;
      const avgGrowthRate =
        platforms.length > 0
          ? platforms.reduce((sum, p) => sum + p.growthRate, 0) /
            platforms.length
          : 0;

      // Get recent posts
      const recentPosts = await db
        .collection("posts")
        .find(platformFilter)
        .sort({ publishedAt: -1 })
        .limit(10)
        .toArray();

      // Get top performing posts
      const topPosts = await db
        .collection("posts")
        .find(platformFilter)
        .sort({ engagementRate: -1 })
        .limit(5)
        .toArray();

      // Get daily metrics for trends
      const dailyMetrics = await db
        .collection<DailyMetric>("dailyMetrics")
        .find({ ...platformFilter, ...dateFilter })
        .sort({ date: 1 })
        .toArray();

      // Aggregate daily metrics for chart
      const trendData = aggregateDailyMetrics(dailyMetrics, parseInt(period));

      return NextResponse.json({
        success: true,
        data: {
          overview: {
            totalFollowers,
            totalReach,
            totalImpressions,
            totalEngagement: totalLikes + totalComments + totalShares,
            avgEngagementRate: +avgEngagement.toFixed(2),
            growthRate: +avgGrowthRate.toFixed(2),
            roi: calculateROI(
              totalReach,
              totalLikes + totalComments + totalShares,
            ),
          },
          platforms: platforms.map((p) => ({
            ...p,
            icon: platformIcons[p.platform] || p.icon,
            color: platformColors[p.platform] || p.color,
          })),
          recentPosts,
          topPosts,
          trends: trendData,
          lastUpdated: new Date().toISOString(),
        },
      });
    }

    if (type === "platforms") {
      const platforms = await db
        .collection<PlatformMetrics>("platforms")
        .find(platformFilter)
        .toArray();

      return NextResponse.json({
        success: true,
        data: platforms.map((p) => ({
          ...p,
          icon: platformIcons[p.platform] || p.icon,
          color: platformColors[p.platform] || p.color,
        })),
      });
    }

    if (type === "posts") {
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");

      try {
        // Fetch real posts from social APIs
        let allPosts: any[] = [];

        // Fetch Twitter posts (if no specific platform or platform is twitter)
        if (!platform || platform === "twitter") {
          const twitterHandle = searchParams.get("twitterHandle") || "twitter";
          try {
            const twitterPosts = await getTwitterPosts(
              twitterHandle,
              Math.min(limit, 25),
            );
            allPosts = allPosts.concat(twitterPosts);
          } catch (e) {
            console.error("Error fetching Twitter posts:", e);
          }
        }

        // Fetch Instagram posts (if no specific platform or platform is instagram)
        if (!platform || platform === "instagram") {
          const instagramHandle =
            searchParams.get("instagramHandle") || "instagram";
          try {
            const instaPosts = await getInstagramPosts(
              instagramHandle,
              Math.min(limit, 20),
            );
            allPosts = allPosts.concat(instaPosts);
          } catch (e) {
            console.error("Error fetching Instagram posts:", e);
          }
        }

        // Fetch YouTube videos (if no specific platform or platform is youtube)
        if (!platform || platform === "youtube") {
          const channelId =
            searchParams.get("youtubeChannelId") || "UC_x5XG1OV2P6uZZ5FSM9Ttw"; // Google Developers channel
          try {
            const videos = await getChannelVideos(
              channelId,
              Math.min(limit, 20),
            );
            allPosts = allPosts.concat(videos);
          } catch (e) {
            console.error("Error fetching YouTube videos:", e);
          }
        }

        // Also get MongoDB posts
        const dbPosts = await db
          .collection("posts")
          .find(platformFilter)
          .limit(limit)
          .toArray();

        allPosts = allPosts.concat(dbPosts);

        // Sort by date and paginate
        const sortedPosts = allPosts
          .sort(
            (a, b) =>
              new Date(b.publishedAt || b.createdAt).getTime() -
              new Date(a.publishedAt || a.createdAt).getTime(),
          )
          .slice((page - 1) * limit, page * limit);

        return NextResponse.json({
          success: true,
          data: {
            posts: sortedPosts,
            pagination: {
              page,
              limit,
              total: allPosts.length,
              pages: Math.ceil(allPosts.length / limit),
              hasMore: page * limit < allPosts.length,
            },
          },
        });
      } catch (e) {
        console.error("Error in posts endpoint:", e);
        // Fallback to MongoDB only
        const posts = await db
          .collection("posts")
          .find(platformFilter)
          .sort({ publishedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray();

        const total = await db
          .collection("posts")
          .countDocuments(platformFilter);

        return NextResponse.json({
          success: true,
          data: {
            posts,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit),
              hasMore: page * limit < total,
            },
          },
        });
      }
    }

    if (type === "audience") {
      const audienceData = await db
        .collection<AudienceData>("audience")
        .find(platformFilter)
        .toArray();

      // Aggregate audience data across platforms if no specific platform
      if (!platform && audienceData.length > 0) {
        const aggregatedAudience = aggregateAudienceData(audienceData);
        return NextResponse.json({
          success: true,
          data: aggregatedAudience,
        });
      }

      return NextResponse.json({
        success: true,
        data: audienceData[0] || null,
      });
    }

    if (type === "trends") {
      const dailyMetrics = await db
        .collection<DailyMetric>("dailyMetrics")
        .find({ ...platformFilter, ...dateFilter })
        .sort({ date: 1 })
        .toArray();

      const trendData = aggregateDailyMetrics(dailyMetrics, parseInt(period));

      return NextResponse.json({
        success: true,
        data: trendData,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid type parameter",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analytics data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Helper function to aggregate daily metrics for charts
function aggregateDailyMetrics(metrics: DailyMetric[], days: number) {
  const groupedByDate: Record<
    string,
    {
      followers: number;
      engagement: number;
      reach: number;
      impressions: number;
      posts: number;
      count: number;
    }
  > = {};

  metrics.forEach((m) => {
    const dateKey = new Date(m.date).toISOString().split("T")[0];
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = {
        followers: 0,
        engagement: 0,
        reach: 0,
        impressions: 0,
        posts: 0,
        count: 0,
      };
    }
    groupedByDate[dateKey].followers += m.followers;
    groupedByDate[dateKey].engagement += m.engagement;
    groupedByDate[dateKey].reach += m.reach;
    groupedByDate[dateKey].impressions += m.impressions;
    groupedByDate[dateKey].posts += m.posts;
    groupedByDate[dateKey].count += 1;
  });

  const labels = Object.keys(groupedByDate).sort();

  // Determine appropriate interval based on days
  const interval = days <= 7 ? 1 : days <= 30 ? 1 : days <= 90 ? 7 : 30;
  const filteredLabels = labels.filter(
    (_, i) => i % interval === 0 || i === labels.length - 1,
  );

  return {
    labels: filteredLabels.map((d) => formatDateLabel(d, days)),
    followers: {
      data: filteredLabels.map((d) => groupedByDate[d]?.followers || 0),
      growth: calculateGrowth(
        filteredLabels.map((d) => groupedByDate[d]?.followers || 0),
      ),
    },
    engagement: {
      data: filteredLabels.map(
        (d) =>
          +(
            groupedByDate[d]?.engagement / (groupedByDate[d]?.count || 1)
          ).toFixed(2) || 0,
      ),
    },
    reach: {
      data: filteredLabels.map((d) => groupedByDate[d]?.reach || 0),
    },
    impressions: {
      data: filteredLabels.map((d) => groupedByDate[d]?.impressions || 0),
    },
    posts: {
      data: filteredLabels.map((d) => groupedByDate[d]?.posts || 0),
      total: Object.values(groupedByDate).reduce((sum, d) => sum + d.posts, 0),
    },
  };
}

// Helper function to aggregate audience data across platforms
function aggregateAudienceData(audienceData: AudienceData[]) {
  const ageGroups: Record<string, number[]> = {};
  const genders: Record<string, number[]> = {};
  const locations: Record<string, number[]> = {};
  const interests: Record<string, number[]> = {};
  const activeHours: Record<number, number[]> = {};
  const activeDays: Record<string, number[]> = {};

  audienceData.forEach((a) => {
    a.demographics.age.forEach((ag) => {
      if (!ageGroups[ag.range]) ageGroups[ag.range] = [];
      ageGroups[ag.range].push(ag.percentage);
    });

    a.demographics.gender.forEach((g) => {
      if (!genders[g.type]) genders[g.type] = [];
      genders[g.type].push(g.percentage);
    });

    a.demographics.locations.forEach((l) => {
      if (!locations[l.country]) locations[l.country] = [];
      locations[l.country].push(l.percentage);
    });

    a.interests.forEach((i) => {
      if (!interests[i.name]) interests[i.name] = [];
      interests[i.name].push(i.percentage);
    });

    a.activeHours.forEach((h) => {
      if (!activeHours[h.hour]) activeHours[h.hour] = [];
      activeHours[h.hour].push(h.engagement);
    });

    a.activeDays.forEach((d) => {
      if (!activeDays[d.day]) activeDays[d.day] = [];
      activeDays[d.day].push(d.engagement);
    });
  });

  return {
    demographics: {
      age: Object.entries(ageGroups).map(([range, values]) => ({
        range,
        percentage: Math.round(
          values.reduce((a, b) => a + b, 0) / values.length,
        ),
      })),
      gender: Object.entries(genders).map(([type, values]) => ({
        type,
        percentage: Math.round(
          values.reduce((a, b) => a + b, 0) / values.length,
        ),
      })),
      locations: Object.entries(locations)
        .map(([country, values]) => ({
          country,
          percentage: Math.round(
            values.reduce((a, b) => a + b, 0) / values.length,
          ),
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 8),
    },
    interests: Object.entries(interests)
      .map(([name, values]) => ({
        name,
        percentage: Math.round(
          values.reduce((a, b) => a + b, 0) / values.length,
        ),
      }))
      .sort((a, b) => b.percentage - a.percentage),
    activeHours: Object.entries(activeHours).map(([hour, values]) => ({
      hour: parseInt(hour),
      engagement: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    })),
    activeDays: Object.entries(activeDays).map(([day, values]) => ({
      day,
      engagement: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    })),
  };
}

function formatDateLabel(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  if (days <= 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else if (days <= 30) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

function calculateGrowth(data: number[]): number {
  if (data.length < 2) return 0;
  const first = data[0] || 1;
  const last = data[data.length - 1] || 0;
  return +(((last - first) / first) * 100).toFixed(2);
}

function calculateROI(reach: number, engagement: number): number {
  // Simple ROI calculation based on engagement/reach ratio
  if (reach === 0) return 0;
  const baseROI = (engagement / reach) * 100;
  return +(baseROI * 0.5 + 1).toFixed(1); // Scale to reasonable ROI multiplier
}
