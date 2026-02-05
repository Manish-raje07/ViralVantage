import { useEffect, useRef, useState } from "react";
import type { SocialPost } from "@/types";

type Status = "idle" | "connecting" | "open" | "closed" | "error";

// Real-time hook for Twitter posts via RapidAPI
// Requires username to be passed
export function useTwitterRealtime(options?: {
  username?: string;
}) {
  const { username = "twitter" } = options || {};
  const [data, setData] = useState<SocialPost[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!username) {
      setStatus("error");
      setError("Missing username");
      return;
    }

    setStatus("connecting");
    setError(null);

    // Build URL with required params
    const url = new URL(
      "/api/realtime/twitter",
      typeof window !== "undefined" ? window.location.origin : "",
    );
    url.searchParams.set("username", username);

    const es = new EventSource(url.toString());
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
  }, [username]);
