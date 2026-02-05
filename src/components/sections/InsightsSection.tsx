"use client";

import { useState, useEffect } from "react";
import { Lightbulb, TrendingUp, Clock, Target, Zap, RefreshCw, Loader2, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Insight {
  type: string;
  title: string;
  content: string;
  priority: "high" | "medium" | "low";
  actionable: boolean;
}

interface InsightsData {
  insights: Insight[];
  source: string;
  generatedAt?: string;
}

const typeIcons: Record<string, typeof Lightbulb> = {
  best_time: Clock,
  content_type: Target,
  viral_factor: Zap,
  recommendation: Lightbulb,
  trend: TrendingUp,
};

const priorityColors: Record<string, string> = {
  high: "from-rose-500 to-pink-500",
  medium: "from-amber-500 to-orange-500",
  low: "from-blue-500 to-cyan-500",
};

const priorityBgColors: Record<string, string> = {
  high: "bg-rose-500/10 border-rose-500/20",
  medium: "bg-amber-500/10 border-amber-500/20",
  low: "bg-blue-500/10 border-blue-500/20",
};

export function InsightsSection() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/insights");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateInsights = async () => {
    setIsRegenerating(true);
    try {
      const response = await fetch("/api/insights", { method: "POST" });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to regenerate insights:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-muted-foreground">Analyzing your data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.insights.length === 0) {
    return (
      <div className="text-center py-12">
        <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">No insights available yet</p>
        <Button onClick={regenerateInsights}>Generate Insights</Button>
      </div>
    );
  }

  // Split insights by priority
  const highPriorityInsights = data.insights.filter((i) => i.priority === "high");
  const otherInsights = data.insights.filter((i) => i.priority !== "high");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI-Powered Insights</h2>
            <p className="text-sm text-muted-foreground">
              Strategic recommendations based on your data
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={regenerateInsights}
          disabled={isRegenerating}
        >
          {isRegenerating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Regenerate
        </Button>
      </div>

      {/* Source indicator */}
      {data.generatedAt && (
        <p className="text-xs text-muted-foreground">
          Generated: {new Date(data.generatedAt).toLocaleString()} • Source:{" "}
          {data.source === "fresh" ? "AI Analysis" : data.source}
        </p>
      )}

      {/* High Priority Insights */}
      {highPriorityInsights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            Priority Actions
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {highPriorityInsights.map((insight, index) => {
              const IconComponent = typeIcons[insight.type] || Lightbulb;
              return (
                <Card
                  key={index}
                  className={`${priorityBgColors[insight.priority]} border overflow-hidden transition-all hover:shadow-lg cursor-pointer`}
                  onClick={() =>
                    setExpandedInsight(expandedInsight === index ? null : index)
                  }
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className={`h-10 w-10 rounded-xl bg-gradient-to-br ${priorityColors[insight.priority]} flex items-center justify-center flex-shrink-0`}
                      >
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg">{insight.title}</h4>
                          {insight.actionable && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-500 rounded-full">
                              Actionable
                            </span>
                          )}
                        </div>
                        <p
                          className="text-sm text-muted-foreground mt-2"
                          dangerouslySetInnerHTML={{
                            __html: insight.content.replace(
                              /\*\*(.*?)\*\*/g,
                              "<strong class='text-foreground'>$1</strong>"
                            ),
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Insights */}
      {otherInsights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            Additional Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherInsights.map((insight, index) => {
              const IconComponent = typeIcons[insight.type] || Lightbulb;
              const actualIndex = highPriorityInsights.length + index;
              const isExpanded = expandedInsight === actualIndex;

              return (
                <Card
                  key={index}
                  className={`${priorityBgColors[insight.priority]} border overflow-hidden transition-all hover:shadow-md cursor-pointer ${
                    isExpanded ? "lg:col-span-2" : ""
                  }`}
                  onClick={() =>
                    setExpandedInsight(isExpanded ? null : actualIndex)
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-8 w-8 rounded-lg bg-gradient-to-br ${priorityColors[insight.priority]} flex items-center justify-center flex-shrink-0`}
                      >
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{insight.title}</h4>
                          <ChevronRight
                            className={`h-4 w-4 text-muted-foreground transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </div>
                        <p
                          className={`text-sm text-muted-foreground mt-1 ${
                            isExpanded ? "" : "line-clamp-2"
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: insight.content.replace(
                              /\*\*(.*?)\*\*/g,
                              "<strong class='text-foreground'>$1</strong>"
                            ),
                          }}
                        />
                        {insight.actionable && isExpanded && (
                          <Button size="sm" className="mt-3">
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <Card className="bg-gradient-to-br from-muted/50 to-muted">
        <CardHeader>
          <CardTitle className="text-base">Insight Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-500">
                {data.insights.length}
              </p>
              <p className="text-sm text-muted-foreground">Total Insights</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-rose-500">
                {highPriorityInsights.length}
              </p>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">
                {data.insights.filter((i) => i.actionable).length}
              </p>
              <p className="text-sm text-muted-foreground">Actionable</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-500">
                {otherInsights.length}
              </p>
              <p className="text-sm text-muted-foreground">Recommendations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
