"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Heart, MessageCircle, Share2, Eye, TrendingUp, Download, Zap } from "lucide-react";

interface MetricsData {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  totalImpressions: number;
  avgEngagementRate: number;
  topPost: any;
  platformBreakdown: any[];
  postTypeComparison: any[];
  trends: any[];
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function UnifiedMetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from analytics endpoint
      const response = await fetch(`/api/analytics?type=overview&period=${timeRange}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data?.overview) {
        const overview = data.data.overview;
        setMetrics({
          totalLikes: overview.totalLikes || 0,
          totalComments: overview.totalComments || 0,
          totalShares: overview.totalShares || 0,
          totalReach: overview.totalReach || 0,
          totalImpressions: overview.totalImpressions || 0,
          avgEngagementRate: overview.avgEngagementRate || 0,
          topPost: overview.topPost || null,
          platformBreakdown: overview.platforms || [],
          postTypeComparison: generatePostTypeComparison(overview.recentPosts || []),
          trends: overview.trends || [],
        });
      } else {
        setError("No data available. Please connect your social media accounts.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch metrics");
      console.error("Error fetching metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const generatePostTypeComparison = (posts: any[]) => {
    const types = {
      reels: { engagement: 0, count: 0, reach: 0 },
      carousels: { engagement: 0, count: 0, reach: 0 },
      static: { engagement: 0, count: 0, reach: 0 },
    };

    posts.forEach((post: any) => {
      const type = post.type || "static";
      const key = type.includes("video") || type.includes("reel") ? "reels" 
                  : type.includes("carousel") ? "carousels" 
                  : "static";
      
      types[key as keyof typeof types].count++;
      types[key as keyof typeof types].engagement += (post.metrics?.engagementRate || 0);
      types[key as keyof typeof types].reach += (post.metrics?.reach || 0);
    });

    return Object.entries(types).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      avgEngagement: data.count > 0 ? (data.engagement / data.count).toFixed(2) : 0,
      count: data.count,
      totalReach: data.reach,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Zap className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Loading your unified metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-900">{error}</p>
            <Button onClick={fetchMetrics} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Unified Metrics Dashboard</h1>
          <p className="text-muted-foreground mt-1">All your social platforms in one view</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-background"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Reach"
          value={metrics?.totalReach || 0}
          icon={<Eye className="h-5 w-5" />}
          color="bg-blue-50"
        />
        <MetricCard
          title="Likes"
          value={metrics?.totalLikes || 0}
          icon={<Heart className="h-5 w-5 text-red-500" />}
          color="bg-red-50"
        />
        <MetricCard
          title="Comments"
          value={metrics?.totalComments || 0}
          icon={<MessageCircle className="h-5 w-5 text-blue-500" />}
          color="bg-blue-50"
        />
        <MetricCard
          title="Shares"
          value={metrics?.totalShares || 0}
          icon={<Share2 className="h-5 w-5 text-green-500" />}
          color="bg-green-50"
        />
        <MetricCard
          title="Engagement Rate"
          value={`${(metrics?.avgEngagementRate || 0).toFixed(2)}%`}
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          color="bg-purple-50"
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comparison">Post Format Comparison</TabsTrigger>
          <TabsTrigger value="platforms">By Platform</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="toppost">Top Performer</TabsTrigger>
        </TabsList>

        {/* Post Format Comparison */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Post Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart - Avg Engagement by Format */}
                <div>
                  <h3 className="text-sm font-semibold mb-4">Average Engagement Rate</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics?.postTypeComparison || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avgEngagement" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Post Type Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Detailed Breakdown</h3>
                  {metrics?.postTypeComparison.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-slate-50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs bg-white px-2 py-1 rounded">{item.count} posts</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Avg Engagement</p>
                          <p className="font-bold">{item.avgEngagement}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Reach</p>
                          <p className="font-bold">{(item.totalReach / 1000).toFixed(1)}k</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Platform */}
        <TabsContent value="platforms">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={metrics?.platformBreakdown || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="followers"
                      >
                        {metrics?.platformBreakdown.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {metrics?.platformBreakdown.map((platform: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg border flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium capitalize">{platform.platform}</p>
                        <p className="text-sm text-muted-foreground">
                          {platform.followers?.toLocaleString()} followers
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {platform.engagement?.toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Engagement</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metrics?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="engagement"
                    stroke="#3b82f6"
                    name="Engagement Rate"
                  />
                  <Line
                    type="monotone"
                    dataKey="reach"
                    stroke="#10b981"
                    name="Reach"
                  />
                  <Line
                    type="monotone"
                    dataKey="followers"
                    stroke="#f59e0b"
                    name="Followers"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Performer */}
        <TabsContent value="toppost">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Post</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.topPost ? (
                <div className="space-y-6">
                  {metrics.topPost.mediaUrl && (
                    <img
                      src={metrics.topPost.mediaUrl}
                      alt="Top post"
                      className="w-full rounded-lg max-h-96 object-cover"
                    />
                  )}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Posted on</p>
                      <p className="font-semibold capitalize">{metrics.topPost.platform}</p>
                    </div>
                    <p className="text-base">{metrics.topPost.content}</p>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-slate-50">
                        <p className="text-xs text-muted-foreground">Likes</p>
                        <p className="text-lg font-bold">{metrics.topPost.metrics?.likes || 0}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50">
                        <p className="text-xs text-muted-foreground">Comments</p>
                        <p className="text-lg font-bold">{metrics.topPost.metrics?.comments || 0}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50">
                        <p className="text-xs text-muted-foreground">Shares</p>
                        <p className="text-lg font-bold">{metrics.topPost.metrics?.shares || 0}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50">
                        <p className="text-xs text-muted-foreground">Engagement</p>
                        <p className="text-lg font-bold">
                          {metrics.topPost.metrics?.engagementRate?.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No posts available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

function MetricCard({ title, value, icon, color }: MetricCardProps) {
  return (
    <Card>
      <CardContent className={`pt-6 ${color}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">{title}</p>
            <p className="text-2xl font-bold mt-2">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
