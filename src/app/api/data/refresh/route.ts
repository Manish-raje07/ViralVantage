import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getChannelStats, getRecentVideos } from '@/lib/social/youtube';
import { getUserTweets, getUserProfile } from '@/lib/social/twitter';
import { getInstagramMedia, getAccountInsights } from '@/lib/social/instagram';
import { Platform } from '@/types';

// Default Channel ID for demo (Google Developers) if none in env
const DEFAULT_YOUTUBE_CHANNEL_ID = 'UC_x5XG1OV2P6uZZ5FSM9Ttw';

export async function POST() {
    try {
        const db = await getDatabase();

        const youtubeKey = process.env.YOUTUBE_API_KEY;
        const youtubeChannelId = process.env.YOUTUBE_CHANNEL_ID || DEFAULT_YOUTUBE_CHANNEL_ID;

        const twitterToken = process.env.TWITTER_BEARER_TOKEN;
        const twitterUserId = process.env.TWITTER_USER_ID; // Need to add this to env if specific user needed

        const metaToken = process.env.META_ACCESS_TOKEN;
        const metaUserId = process.env.META_USER_ID; // Instagram Business Account ID

        const platformsData = [];
        let allPosts: any[] = [];

        // --- YouTube ---
        if (youtubeKey) {
            console.log('Fetching YouTube data...');
            const stats = await getChannelStats(youtubeKey, youtubeChannelId);
            const videos = await getRecentVideos(youtubeKey, youtubeChannelId);

            platformsData.push({
                platform: 'youtube',
                followers: stats.followers,
                reach: stats.views,
                engagement: 0, // Hard to calc without extra calls
                impressions: stats.views,
                posts: stats.videoCount,
                username: 'YouTube Channel',
                color: '#FF0000',
                verified: true,
                lastUpdated: new Date()
            });

            allPosts = [...allPosts, ...videos];
        } else {
            console.warn('Skipping YouTube: No API Key');
        }

        // --- Twitter (Stub/Real) ---
        if (twitterToken && twitterUserId) {
            // Real fetch implementation
            try {
                const profile = await getUserProfile(twitterToken, twitterUserId);
                const tweets = await getUserTweets(twitterToken, twitterUserId);
                platformsData.push({
                    platform: 'twitter',
                    followers: profile.followers,
                    posts: profile.tweetCount,
                    username: '@user', // Would fetch real username if profile endpoint supports it
                    color: '#1DA1F2',
                    verified: false,
                    lastUpdated: new Date()
                });
                allPosts = [...allPosts, ...tweets];
            } catch (e) {
                console.error('Twitter fetch failed:', e);
            }
        } else {
            console.log('Skipping Twitter: Missing Token/ID');
            // We could technically push an "Empty" platform state here to show it exists but is disconnected
        }

        // --- Instagram (Stub/Real) ---
        if (metaToken && metaUserId) {
            try {
                const insights = await getAccountInsights(metaToken, metaUserId);
                const media = await getInstagramMedia(metaToken, metaUserId);
                platformsData.push({
                    platform: 'instagram',
                    followers: insights.followers,
                    posts: 0, // Need to add media count to insights
                    color: '#E4405F',
                    lastUpdated: new Date()
                });
                allPosts = [...allPosts, ...media];
            } catch (e) {
                console.error('Instagram fetch failed:', e);
            }
        } else {
            console.log('Skipping Instagram: Missing Token/ID');
        }

        // Update DB
        if (platformsData.length > 0) {
            // First, clear old platform entries that we are about to update? 
            // Or just upsert. For "Real-time" mode, let's replace for now to avoid duplicates.
            // But we want to keep one document per platform.
            for (const p of platformsData) {
                await db.collection('platforms').updateOne(
                    { platform: p.platform },
                    { $set: p },
                    { upsert: true }
                );
            }
        }

        if (allPosts.length > 0) {
            // Upsert posts based on platform+postId
            for (const post of allPosts) {
                await db.collection('posts').updateOne(
                    { platform: post.platform, postId: post.postId },
                    { $set: post },
                    { upsert: true }
                );
            }
        }

        return NextResponse.json({
            message: 'Refresh complete',
            platformsUpdated: platformsData.length,
            postsFetched: allPosts.length,
            skipped: {
                youtube: !youtubeKey,
                twitter: !twitterToken || !twitterUserId,
                instagram: !metaToken || !metaUserId
            }
        });

    } catch (error) {
        console.error('Error refreshing data:', error);
        return NextResponse.json({ error: 'Failed to refresh data' }, { status: 500 });
    }
}
