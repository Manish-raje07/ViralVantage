import { NextRequest } from 'next/server';
import { generateSampleTwitterData, getUserTweets } from '@/lib/social/twitter';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') || 'demo';
  const userId = url.searchParams.get('userId') || undefined;
  const bearer = url.searchParams.get('bearer') || undefined;

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      // Helper to push an event
      function pushEvent(eventName: string, data: any) {
        try {
          const payload = `event: ${eventName}\n` + `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(payload));
        } catch (e) {
          // ignore
        }
      }

      // Send a comment to establish the stream
      controller.enqueue(new TextEncoder().encode(': connected\n\n'));

      if (mode === 'demo') {
        // Demo mode: push generated sample tweets periodically
        const samples = generateSampleTwitterData();
        let idx = 0;
        const interval = setInterval(() => {
          if (closed) return;
          const item = samples[idx % samples.length];
          pushEvent('tweet', item);
          idx += 1;
        }, 3000);

        // Stop when cancelled
        controller.signal.addEventListener('abort', () => {
          closed = true;
          clearInterval(interval);
          controller.close();
        });
      } else {
        // Polling mode (uses real Twitter API). Requires `userId` and `bearer`.
        if (!userId || !bearer) {
          pushEvent('error', { message: 'Missing userId or bearer token for poll mode' });
          controller.close();
          return;
        }

        let lastSeen = new Set<string>();

        const pollFn = async () => {
          try {
            const posts = await getUserTweets(bearer, userId, 25);
            // send only new posts
            for (const p of posts.reverse()) {
              if (!lastSeen.has(p.postId)) {
                pushEvent('tweet', p);
                lastSeen.add(p.postId);
              }
            }
          } catch (e) {
            pushEvent('error', { message: 'Polling error', detail: String(e) });
          }
        };

        // initial poll then interval
        await pollFn();
        const interval = setInterval(pollFn, 5000);

        controller.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      }
    },
  });

  return new Response(stream, { headers });
}
