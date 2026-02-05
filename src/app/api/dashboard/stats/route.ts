import { NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/mongodb';

export async function GET() {
  try {
    const platformsCollection = await getCollection(COLLECTIONS.POSTS); // Using posts to derive some stats if needed, but mostly platforms
    // Actually we need the 'platforms' collection for the overview stats as per seed
    // The seed script uses 'platforms' collection which isn't in the COLLECTIONS const in lib/mongodb.ts yet. 
    
    // Let's check lib/mongodb.ts again. 
    // It seems I need to update lib/mongodb.ts to include 'platforms' collection or just use string.
    // I'll stick to using the helpers.
    
    const db = await import('@/lib/mongodb').then(m => m.getDatabase());
    const platforms = await db.collection('platforms').find({}).toArray();
    
    // Calculate aggregates
    const totalFollowers = platforms.reduce((acc, curr) => acc + (curr.followers || 0), 0);
    const totalReach = platforms.reduce((acc, curr) => acc + (curr.reach || 0), 0);
    const totalEngagement = platforms.reduce((acc, curr) => acc + (curr.engagement || 0), 0);
    const avgEngagement = platforms.length > 0 ? totalEngagement / platforms.length : 0;

    return NextResponse.json({
      totalFollowers,
      totalReach,
      avgEngagement: parseFloat(avgEngagement.toFixed(2)),
      platformCount: platforms.length
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
