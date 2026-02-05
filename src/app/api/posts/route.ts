import { NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/mongodb';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        const postsCollection = await getCollection(COLLECTIONS.POSTS);
        const posts = await postsCollection
            .find({})
            .sort({ publishedAt: -1 })
            .limit(limit)
            .toArray();

        return NextResponse.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}
