import { NextRequest } from "next/server";
import { getUserTweets } from "@/lib/social/twitter-rapidapi";

export const runtime = "nodejs";

// Real-time Twitter streaming endpoint via RapidAPI
// Requires username in query params
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username") || "twitter";

  if (!username) {
    return new Response(
      JSON.stringify({
        error: "Missing username",
        message: "Provide username as a query param (e.g., ?username=twitter)",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      // Helper to push an event
      function pushEvent(eventName: string, data: any) {
        try {
          const payload =
            `event: ${eventName}\n` + `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(payload));
        } catch (e) {
          // ignore
        }
      }

      // Send a comment to establish the stream
      controller.enqueue(new TextEncoder().encode(": connected\n\n"));

      // Real-time polling from Twitter RapidAPI
      let lastSeen = new Set<string>();

      const pollFn = async () => {
        try {
          const posts = await getUserTweets(username, 25);
          // send only new posts
          for (const p of posts.reverse()) {
            if (!lastSeen.has(p.postId)) {
              pushEvent("tweet", p);
              lastSeen.add(p.postId);
            }
          }
        } catch (e) {
          pushEvent("error", { message: "Polling error", detail: String(e) });
        }
      };
      // initial poll then interval
      await pollFn();
      const interval = setInterval(pollFn, 5000);

      // Cleanup on client disconnect
      // Note: SSE doesn't provide direct signal, so we rely on interval cleanup
      // In production, consider using a heartbeat and timeout mechanism
    },
  });

  return new Response(stream, { headers });
}
