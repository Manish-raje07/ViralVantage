"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertCircle, CheckCircle, Zap } from "lucide-react";

interface Insight {
  id: string;
  title: string;
  description: string;
  type: "opportunity" | "warning" | "success" | "tip";
  recommendation: string;
  impact: "high" | "medium" | "low";
}

export function InsightsAndRecommendations() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/insights");
      if (!response.ok) {
        throw new Error("Failed to fetch insights");
      }

      const data = await response.json();
      const generatedInsights = generateInsights(data);
      setInsights(generatedInsights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load insights");
      // Generate default insights if API fails
      setInsights(getDefaultInsights());
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (data: any): Insight[] => {
    const insights: Insight[] = [];

    // Analyze engagement trends
    if (data.avgEngagement && data.avgEngagement > 5) {
      insights.push({
        id: "1",
        title: "Strong Engagement Performance",
        description: `Your posts are averaging ${data.avgEngagement.toFixed(2)}% engagement rate, which is above industry standard.`,
        type: "success",
        recommendation: "Continue with current content strategy. Consider scaling up posting frequency.",
        impact: "high",
      });
    }

    // Post frequency analysis
    if (data.totalPosts && data.totalPosts < 4) {
      insights.push({
        id: "2",
        title: "Increase Posting Frequency",
        description: "You're posting less than 1 post per week. Consistency drives engagement.",
        type: "opportunity",
        recommendation: "Aim for at least 3-4 posts per week to maintain audience connection.",
        impact: "medium",
      });
    }

    // Best performing content
    if (data.bestContent) {
      insights.push({
        id: "3",
        title: `${data.bestContent.type} Content Performs Best`,
        description: `Your ${data.bestContent.type} posts get ${data.bestContent.engagement}% more engagement on average.`,
        type: "tip",
        recommendation: `Allocate more resources to creating ${data.bestContent.type} content.`,
        impact: "high",
      });
    }

    // Growth opportunity
    if (data.slowGrowth) {
      insights.push({
        id: "4",
        title: "Follower Growth Slowing",
        description: "Your follower growth rate has decreased by 15% this month.",
        type: "warning",
        recommendation: "Engage more with your audience through comments and DMs. Try new content formats.",
        impact: "medium",
      });
    }

    return insights.length > 0 ? insights : getDefaultInsights();
  };

  const getDefaultInsights = (): Insight[] => [
    {
      id: "1",
      title: "Connect Your Accounts",
      description: "Start tracking insights by connecting your social media accounts.",
      type: "opportunity",
      recommendation: "Connect Twitter, Instagram, YouTube to get personalized recommendations.",
      impact: "high",
    },
    {
      id: "2",
      title: "Enable Real-Time Monitoring",
      description: "Get instant notifications about post performance and audience engagement.",
      type: "tip",
      recommendation: "Set up real-time monitoring to catch trending moments.",
      impact: "medium",
    },
    {
      id: "3",
      title: "Use Data-Driven Insights",
      description: "AI will analyze your content and suggest what works best for your audience.",
      type: "success",
      recommendation: "Ask questions about your performance to get personalized recommendations.",
      impact: "high",
    },
  ];

  const getIconForType = (type: string) => {
    switch (type) {
      case "opportunity":
        return <Zap className="h-5 w-5 text-yellow-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "tip":
        return <Sparkles className="h-5 w-5 text-blue-500" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "opportunity":
        return "bg-yellow-50 border-yellow-200";
      case "warning":
        return "bg-red-50 border-red-200";
      case "success":
        return "bg-green-50 border-green-200";
      case "tip":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Sparkles className="h-8 w-8 animate-spin mx-auto mb-2" />
          Loading insights...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-yellow-500" />
          Insights & Recommendations
        </h2>
        <Button variant="outline" size="sm" onClick={fetchInsights}>
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-700 text-sm">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {insights.map((insight) => (
          <Card key={insight.id} className={`border ${getTypeColor(insight.type)}`}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">{getIconForType(insight.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold">{insight.title}</h3>
                    <Badge
                      variant="secondary"
                      className="ml-2"
                    >
                      {insight.impact === "high" ? "🔴 High" : insight.impact === "medium" ? "🟡 Medium" : "🟢 Low"} Impact
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">{insight.description}</p>

                  <div className="p-3 rounded bg-white bg-opacity-60 border border-current border-opacity-10">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Recommended Action:</p>
                    <p className="text-sm text-slate-700">{insight.recommendation}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
