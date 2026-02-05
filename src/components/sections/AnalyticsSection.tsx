"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from "chart.js";
import { Eye, MessageCircle, BarChart3, Target, Globe, Clock, Loader2, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

interface AnalyticsData {
  overview: {
    totalFollowers: number;
    totalReach: number;
    totalImpressions: number;
    totalEngagement: number;
    avgEngagementRate: number;
    growthRate: number;
  };
  platforms: Array<{
    platform: string;
    followers: number;
    engagement: number;
    reach: number;
    impressions: number;
    color: string;
  }>;
  trends: {
    labels: string[];
    followers: { data: number[]; growth: number };
    engagement: { data: number[] };
    reach: { data: number[] };
    impressions: { data: number[] };
  };
  lastUpdated: string;
}

interface AudienceData {
  demographics: {
    age: { range: string; percentage: number }[];
    gender: { type: string; percentage: number }[];
    locations: { country: string; percentage: number }[];
  };
  interests: { name: string; percentage: number }[];
  activeHours: { hour: number; engagement: number }[];
  activeDays: { day: string; engagement: number }[];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function AnalyticsSection() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [audienceData, setAudienceData] = useState<AudienceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('30');

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [analyticsRes, audienceRes] = await Promise.all([
        fetch(`/api/analytics?type=overview&period=${period}`),
        fetch(`/api/analytics?type=audience`),
      ]);
      
      const analyticsResult = await analyticsRes.json();
      const audienceResult = await audienceRes.json();
      
      if (analyticsResult.success) {
        setData(analyticsResult.data);
      }
      if (audienceResult.success) {
        setAudienceData(audienceResult.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-muted-foreground">No analytics data available</p>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  // Prepare chart data from real data
  const followerGrowthData = {
    labels: data.trends.labels,
    datasets: data.platforms.slice(0, 4).map((p) => ({
      label: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
      data: data.trends.followers.data.map(d => Math.floor(d * (p.followers / data.overview.totalFollowers))),
      borderColor: p.color,
      backgroundColor: p.color + '20',
      tension: 0.4,
      fill: true,
    })),
  };

  const engagementRateData = {
    labels: data.platforms.map(p => p.platform.charAt(0).toUpperCase() + p.platform.slice(1)),
    datasets: [{
      label: "Engagement Rate (%)",
      data: data.platforms.map(p => p.engagement),
      backgroundColor: data.platforms.map(p => p.color),
    }],
  };

  const reachData = {
    labels: data.platforms.slice(0, 5).map(p => p.platform.charAt(0).toUpperCase() + p.platform.slice(1)),
    datasets: [{
      label: "Reach Distribution",
      data: data.platforms.slice(0, 5).map(p => p.reach),
      backgroundColor: data.platforms.slice(0, 5).map(p => p.color),
    }],
  };

  const demographicsData = audienceData ? {
    labels: audienceData.demographics.age.map(a => a.range),
    datasets: [{
      label: "Age Distribution (%)",
      data: audienceData.demographics.age.map(a => a.percentage),
      backgroundColor: "#6366f1",
    }],
  } : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics & Insights</h2>
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
          <Button size="sm" variant="ghost" onClick={fetchData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview.totalReach)}</div>
            <div className="flex items-center gap-1">
              {data.overview.growthRate >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${data.overview.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.overview.growthRate >= 0 ? '+' : ''}{data.overview.growthRate}% from last period
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview.totalImpressions)}</div>
            <p className="text-xs text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview.totalEngagement)}</div>
            <p className="text-xs text-muted-foreground">Total interactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.avgEngagementRate}%</div>
            <p className="text-xs text-muted-foreground">Industry avg: 3.5%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Follower Growth Trends</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-56">
              <Line data={followerGrowthData} options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { 
                  legend: { 
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 8, font: { size: 11 } }
                  }
                },
                scales: {
                  y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.1)' } },
                  x: { grid: { display: false } }
                }
              }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Platform Engagement Rates</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-56">
              <Bar data={engagementRateData} options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.1)' } },
                  x: { grid: { display: false } }
                }
              }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Reach by Platform</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-56">
              <Doughnut data={reachData} options={{ 
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

        {demographicsData && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Audience Demographics</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-56">
                <Bar data={demographicsData} options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.1)' } },
                    x: { grid: { display: false } }
                  }
                }} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Performing Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {audienceData?.demographics.locations.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.country}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-secondary rounded-full h-2">
                      <div 
                        className="h-2 bg-primary rounded-full transition-all" 
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Peak Engagement Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {audienceData?.activeHours
                .sort((a, b) => b.engagement - a.engagement)
                .slice(0, 5)
                .map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">
                        {item.hour.toString().padStart(2, '0')}:00 - {(item.hour + 1).toString().padStart(2, '0')}:00
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.hour >= 6 && item.hour < 12 ? 'Morning' : 
                         item.hour >= 12 && item.hour < 18 ? 'Afternoon' : 
                         item.hour >= 18 && item.hour < 22 ? 'Evening' : 'Night'}
                      </p>
                    </div>
                    <span 
                      className={`text-xs px-2 py-1 rounded-full ${
                        item.engagement >= 80 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : item.engagement >= 60
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {item.engagement >= 80 ? 'Very High' : item.engagement >= 60 ? 'High' : 'Medium'}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
