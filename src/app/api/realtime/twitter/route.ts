import { NextRequest } from "next/server";
import { getUserTweets } from "@/lib/social/twitter";

export const runtime = "nodejs";

// Real-time Twitter streaming endpoint
// Requires userId and bearerToken in query params or env vars
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") || process.env.TWITTER_USER_ID;
  const bearerToken =
    url.searchParams.get("bearerToken") || process.env.TWITTER_BEARER_TOKEN;

  if (!userId || !bearerToken) {
    return new Response(
      JSON.stringify({
        error: "Missing credentials",
        message:
          "Provide userId and bearerToken as query params or set TWITTER_USER_ID and TWITTER_BEARER_TOKEN env vars",
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

      // Real-time polling from Twitter API
      let lastSeen = new Set<string>();

      const pollFn = async () => {
        try {
          const posts = await getUserTweets(bearerToken, userId, 25);
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

      controller.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}
