import { useEffect, useRef, useState } from "react";
import type { SocialPost } from "@/types";

type Status = "idle" | "connecting" | "open" | "closed" | "error";

export function useTwitterRealtime(options?: {
  url?: string;
  mode?: "demo" | "poll";
  userId?: string;
  bearer?: string;
}) {
  const {
    url = "/api/realtime/twitter?mode=demo",
    mode,
    userId,
    bearer,
  } = options || {};
  const [data, setData] = useState<SocialPost[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setStatus("connecting");
    setError(null);

    // Build URL with optional params
    const connectUrl = new URL(
      url,
      typeof window !== "undefined" ? window.location.origin : "",
    );
    if (mode) connectUrl.searchParams.set("mode", mode);
    if (userId) connectUrl.searchParams.set("userId", userId);
    if (bearer) connectUrl.searchParams.set("bearer", bearer);

    const es = new EventSource(connectUrl.toString());
    esRef.current = es;

    es.onopen = () => setStatus("open");
    es.onerror = (ev) => {
      setStatus("error");
      setError("Connection error");
    };

    es.addEventListener("tweet", (ev: MessageEvent) => {
      try {
        const parsed = JSON.parse(ev.data) as SocialPost;
        setData((prev) => [parsed, ...prev].slice(0, 200));
      } catch (e) {
        // ignore
      }
    });

    es.addEventListener("error", (ev: MessageEvent) => {
      try {
        const parsed = JSON.parse(ev.data);
        setError(parsed?.message || "error");
      } catch {
        setError("error");
      }
    });

    return () => {
      es.close();
      setStatus("closed");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, mode, userId, bearer]);

  return { data, status, error, close: () => esRef.current?.close() } as const;
}
