import { NextResponse } from 'next/server';
import { getDatabase, COLLECTIONS } from '@/lib/mongodb';

export async function POST() {
    try {
        const db = await getDatabase();

        // Clear collections
        await db.collection('posts').deleteMany({});
        await db.collection('platforms').deleteMany({});
        // We might also want to clear stats/analytics if they were stored separately, 
        // but based on current implementation stats are derived or stored in 'dailyMetrics' (from seed).
        await db.collection('dailyMetrics').deleteMany({});
        await db.collection('audience').deleteMany({});

        return NextResponse.json({ message: 'All data cleared successfully' });
    } catch (error) {
        console.error('Error clearing data:', error);
        return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 });
    }
}
