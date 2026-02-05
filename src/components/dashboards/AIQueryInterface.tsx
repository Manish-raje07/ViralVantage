"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Lightbulb } from "lucide-react";

interface AIInsight {
  query: string;
  response: string;
  timestamp: Date;
}

const EXAMPLE_QUERIES = [
  "Which post had the highest engagement last month?",
  "Compare engagement rates between Reels and Carousel posts",
  "What's my peak posting time?",
  "Which platform drives the most sales?",
  "What's the average engagement rate across all platforms?",
];

export function AIQueryInterface() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/ai-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process query");
      }

      const newInsight: AIInsight = {
        query,
        response: data.response || data.data?.response || "No response",
        timestamp: new Date(),
      };

      setInsights([newInsight, ...insights]);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  return (
    <div className="space-y-6">
      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Ask About Your Social Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleQuery} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about your social media performance..."
                className="flex-1 px-4 py-2 rounded-lg border bg-background"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !query.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Example Queries */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleQuery(example)}
                  className="text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights History */}
      <div className="space-y-4">
        {insights.length > 0 && <h3 className="text-lg font-semibold">AI Insights</h3>}
        {insights.map((insight, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-blue-600">{insight.query}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {insight.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="ml-5 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {insight.response}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {insights.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Ask a question to get AI-powered insights about your social performance</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
