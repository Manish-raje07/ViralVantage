"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EngagementEvent = {
  id: number;
  type: "Like" | "Comment" | "Share";
  user: string;
  post: string;
  time: string;
};

export function EngagementSection() {
  const [events, setEvents] = useState<EngagementEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEngagement = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics?type=engagement');
        if (!response.ok) throw new Error('Failed to fetch engagement');
        const data = await response.json();
        const transformedEvents = (data.data?.engagementEvents || []).slice(0, 4).map((e: any) => ({
          id: Math.random(),
          type: e.type || "Like",
          user: e.userName || "User",
          post: e.postContent || "",
          time: e.timestamp,
        }));
        setEvents(transformedEvents);
      } catch (err) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEngagement();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Recent Engagement</h2>
      {events.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>No engagement data. Connect to real API to load data.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((e) => (
          <Card key={e.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{e.type}</span>
                <span className="text-xs text-muted-foreground">{new Date(e.time).toLocaleString()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <span className="font-semibold">{e.user}</span> {e.type.toLowerCase()}d on post: <span className="italic">&quot;{e.post}&quot;</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
