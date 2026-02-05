import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
    try {
        const db = await getDatabase();
        const platforms = await db.collection('platforms').find({}).toArray();

        return NextResponse.json(platforms);
    } catch (error) {
        console.error('Error fetching platforms:', error);
        return NextResponse.json({ error: 'Failed to fetch platforms' }, { status: 500 });
    }
}
