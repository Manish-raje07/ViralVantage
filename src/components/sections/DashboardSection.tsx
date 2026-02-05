"use client";

import { useState } from "react";
import { useDashboardStats, usePlatformMetrics, useRefreshData, useRecentPosts, useClearData } from "@/hooks/useDashboardData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler } from "chart.js";
import { TrendingUp, TrendingDown, Users, Eye, MessageCircle, Heart, DollarSign, Target, RefreshCw, Loader2, CheckCircle, Instagram, Youtube, Linkedin, Facebook, Twitter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

// Platform icons mapping
const platformIconMap: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  tiktok: <MessageCircle className="h-4 w-4" />,
  reddit: <MessageCircle className="h-4 w-4" />,
  pinterest: <Target className="h-4 w-4" />,
};

interface AnalyticsData {
  overview: {
    totalFollowers: number;
    totalReach: number;
    totalImpressions: number;
    totalEngagement: number;
    avgEngagementRate: number;
    growthRate: number;
    roi: number;
  };
  platforms: Array<{
    platform: string;
    followers: number;
    engagement: number;
    reach: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    growthRate: number;
    color: string;
    username: string;
    verified: boolean;
  }>;
  recentPosts: Array<{
    id: string;
    platform: string;
    content: string;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    publishedAt: string;
  }>;
  topPosts: Array<{
    id: string;
    platform: string;
    content: string;
    likes: number;
    comments: number;
    engagementRate: number;
  }>;
  trends: {
    labels: string[];
    followers: { data: number[]; growth: number };
    engagement: { data: number[] };
    reach: { data: number[] };
    impressions: { data: number[] };
    posts: { data: number[]; total: number };
  };
  lastUpdated: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getGrowthColor(rate: number): string {
  return rate >= 0 ? 'text-green-600' : 'text-red-600';
}

export function DashboardSection() {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: platforms, isLoading: platformsLoading } = usePlatformMetrics();
  const { data: recentPosts, isLoading: postsLoading } = useRecentPosts();
  const refreshMutation = useRefreshData();
  const clearMutation = useClearData();
  const [period, setPeriod] = useState('30');
  const [missingKeys, setMissingKeys] = useState<string[]>([]);

  const loading = statsLoading || platformsLoading || postsLoading;
  const error = null; // simplified for now

  const handleRefresh = () => {
    refreshMutation.mutate(undefined, {
      onSuccess: (data: any) => {
        const missing = [];
        if (data.skipped?.twitter) missing.push("Twitter");
        if (data.skipped?.instagram) missing.push("Instagram");
        setMissingKeys(missing);
      }
    });
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      clearMutation.mutate();
    }
  };

  // Construct data object from multiple sources to match existing UI structure as closely as possible
  const data: AnalyticsData | null = stats && platforms ? {
    overview: {
      totalFollowers: stats.totalFollowers,
      totalReach: stats.totalReach,
      totalImpressions: stats.totalReach * 1.5, // Estimate
      totalEngagement: stats.totalFollowers * (stats.avgEngagement / 100),
      avgEngagementRate: stats.avgEngagement,
      growthRate: 2.5, // Mocked for now
      roi: 3.2, // Mocked for now
    },
    platforms: platforms,
    recentPosts: recentPosts || [],
    topPosts: recentPosts || [], // Reusing recent for top
    trends: { // Mocking trends data for charts to avoid breaking UI
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      followers: { data: [100, 120, 115, 134, 168, 132, 190], growth: 5 },
      engagement: { data: [65, 59, 80, 81, 56, 55, 40] },
      reach: { data: [28, 48, 40, 19, 86, 27, 90] },
      impressions: { data: [35, 38, 55, 60, 45, 65, 70] },
      posts: { data: [4, 5, 2, 8, 3, 5, 4], total: 31 }
    },
    lastUpdated: new Date().toISOString()
  } : null;




  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-red-500">{error || 'No data available'}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  // Prepare chart data from real data
  const platformPostsData = {
    labels: data.platforms.map(p => p.platform.charAt(0).toUpperCase() + p.platform.slice(1)),
    datasets: [{
      label: "Followers",
      data: data.platforms.map(p => p.followers),
      backgroundColor: data.platforms.map(p => p.color),
    }],
  };

  const engagementData = {
    labels: ["Likes", "Comments", "Shares"],
    datasets: [{
      label: "Total Engagement",
      data: [
        data.platforms.reduce((sum, p) => sum + p.likes, 0),
        data.platforms.reduce((sum, p) => sum + p.comments, 0),
        data.platforms.reduce((sum, p) => sum + p.shares, 0),
      ],
      backgroundColor: ["#ef4444", "#f59e42", "#10b981"],
    }],
  };

  const weeklyTrendsData = {
    labels: data.trends.labels,
    datasets: [
      {
        label: "Followers",
        data: data.trends.followers.data,
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Impressions",
        data: data.trends.impressions.data,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm border rounded-md px-2 py-1 bg-background"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Last updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : 'Just now'}
          </span>
          <Button size="sm" variant="ghost" onClick={handleClear} disabled={clearMutation.isPending} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Data
          </Button>
          <Button size="sm" variant="ghost" onClick={handleRefresh} disabled={refreshMutation.isPending}>
            <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {missingKeys.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing API Keys</AlertTitle>
          <AlertDescription>
            Skipped updates for: {missingKeys.join(", ")}. Please add API keys to your .env.local file to enable these platforms.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview.totalFollowers)}</div>
            <div className="flex items-center gap-1">
              {data.overview.growthRate >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${getGrowthColor(data.overview.growthRate)}`}>
                {data.overview.growthRate >= 0 ? '+' : ''}{data.overview.growthRate}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview.totalReach)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(data.overview.totalImpressions)} impressions
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Heart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.avgEngagementRate}%</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(data.overview.totalEngagement)} total interactions
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.roi}x</div>
            <p className="text-xs text-muted-foreground">Return on investment</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Followers by Platform</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-48">
              <Bar data={platformPostsData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { display: false } },
                  x: { grid: { display: false } }
                }
              }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Engagement Mix</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-48">
              <Doughnut data={engagementData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 8, font: { size: 11 } }
                  }
                }
              }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Growth Trends</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-48">
              <Line data={weeklyTrendsData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 8, font: { size: 11 } }
                  }
                },
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.1)' } },
                  x: { grid: { display: false } }
                }
              }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            {data.platforms.map((platform) => (
              <div
                key={platform.platform}
                className="p-4 border rounded-lg space-y-3 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: platform.color }}
                    >
                      {platformIconMap[platform.platform]}
                    </div>
                    <span className="font-semibold capitalize">{platform.platform}</span>
                  </div>
                  {platform.verified && (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Followers:</span>
                    <span className="font-medium">{formatNumber(platform.followers)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Engagement:</span>
                    <span className="font-medium">{platform.engagement.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reach:</span>
                    <span className="font-medium">{formatNumber(platform.reach)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Growth:</span>
                    <Badge variant={platform.growthRate >= 0 ? "default" : "destructive"} className="text-xs">
                      {platform.growthRate >= 0 ? '+' : ''}{platform.growthRate}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topPosts.slice(0, 5).map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: data.platforms.find(p => p.platform === post.platform)?.color || '#888' }}
                    >
                      {platformIconMap[post.platform]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{post.content}</p>
                      <p className="text-xs text-muted-foreground capitalize">{post.platform}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-pink-500" />
                      <span>{formatNumber(post.likes)}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {post.engagementRate}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 border rounded-lg text-center hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                <MessageCircle className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Create Post</span>
              </button>
              <button className="p-4 border rounded-lg text-center hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                <Target className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">New Campaign</span>
              </button>
              <button className="p-4 border rounded-lg text-center hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">View Analytics</span>
              </button>
              <button className="p-4 border rounded-lg text-center hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                <Users className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Manage Accounts</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
