"use client";

import { useState, useEffect } from "react";
import { BarChart2, TrendingUp, Award, ArrowUp, ArrowDown, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FormatComparison {
  format: string;
  postsCount: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgReach: number;
  avgEngagementRate: number;
}

interface CompareData {
  comparisons: FormatComparison[];
  bestFormat: {
    format: string;
    name: string;
    engagementRate: number;
    advantage: string;
  };
  insights: string[];
}

const formatColors: Record<string, string> = {
  reel: "from-rose-500 to-pink-500",
  carousel: "from-blue-500 to-cyan-500",
  static: "from-emerald-500 to-green-500",
  video: "from-amber-500 to-orange-500",
  text: "from-slate-500 to-gray-500",
  story: "from-violet-500 to-purple-500",
};

const formatNames: Record<string, string> = {
  reel: "Reels",
  carousel: "Carousels",
  static: "Static Posts",
  video: "Videos",
  text: "Text Posts",
  story: "Stories",
};

export function CompareSection() {
  const [data, setData] = useState<CompareData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<"engagement" | "likes" | "reach">("engagement");

  useEffect(() => {
    fetchCompareData();
  }, []);

  const fetchCompareData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/compare");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch comparison data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricValue = (comparison: FormatComparison) => {
    switch (selectedMetric) {
      case "likes":
        return comparison.avgLikes;
      case "reach":
        return comparison.avgReach;
      default:
        return comparison.avgEngagementRate;
    }
  };

  const getMaxValue = () => {
    if (!data) return 1;
    return Math.max(...data.comparisons.map((c) => getMetricValue(c)));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load comparison data</p>
        <Button onClick={fetchCompareData} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <BarChart2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Content Format Comparison</h2>
            <p className="text-sm text-muted-foreground">
              Reels vs Carousels vs Static Posts
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCompareData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Best Format Banner */}
      {data.bestFormat && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Best Performing Format</p>
                  <p className="text-xl font-bold">{data.bestFormat.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-500">
                  {data.bestFormat.engagementRate}%
                </p>
                <p className="text-sm text-muted-foreground">{data.bestFormat.advantage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric Selector */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        {[
          { key: "engagement", label: "Engagement Rate" },
          { key: "likes", label: "Avg Likes" },
          { key: "reach", label: "Avg Reach" },
        ].map((metric) => (
          <button
            key={metric.key}
            onClick={() => setSelectedMetric(metric.key as typeof selectedMetric)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
              selectedMetric === metric.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.comparisons.map((comparison, index) => {
          const maxValue = getMaxValue();
          const value = getMetricValue(comparison);
          const percentage = (value / maxValue) * 100;
          const isTop = index === 0;
          const colorClass = formatColors[comparison.format] || "from-gray-500 to-slate-500";

          return (
            <Card
              key={comparison.format}
              className={`overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
                isTop ? "ring-2 ring-blue-500/50" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {formatNames[comparison.format] || comparison.format}
                  </CardTitle>
                  {isTop && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-500 rounded-full">
                      #1
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {comparison.postsCount} posts analyzed
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Metric Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      {selectedMetric === "engagement"
                        ? "Engagement Rate"
                        : selectedMetric === "likes"
                        ? "Avg Likes"
                        : "Avg Reach"}
                    </span>
                    <span className="font-semibold">
                      {selectedMetric === "engagement"
                        ? `${value}%`
                        : value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Metric Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Likes</p>
                    <p className="font-semibold">{comparison.avgLikes.toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Comments</p>
                    <p className="font-semibold">{comparison.avgComments.toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Shares</p>
                    <p className="font-semibold">{comparison.avgShares.toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Reach</p>
                    <p className="font-semibold">{comparison.avgReach.toLocaleString()}</p>
                  </div>
                </div>

                {/* Trend Indicator */}
                <div className="flex items-center gap-2 text-sm">
                  {index < data.comparisons.length / 2 ? (
                    <>
                      <ArrowUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-500">Above average</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4 text-amber-500" />
                      <span className="text-amber-500">Below average</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.insights.map((insight, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-500">
                      {index + 1}
                    </span>
                  </div>
                  <p
                    className="text-sm"
                    dangerouslySetInnerHTML={{
                      __html: insight.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                    }}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
