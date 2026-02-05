import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST() {
    try {
        // Determine the path to the seed script
        const seedScriptPath = path.join(process.cwd(), 'scripts', 'seed-data.ts');

        // Execute the seed script using ts-node (npx ts-node ...)
        // Note: In production this might be different, but for this project context it works.
        const { stdout, stderr } = await execAsync(`npx ts-node "${seedScriptPath}"`);

        console.log('Seed output:', stdout);
        if (stderr) console.error('Seed stderr:', stderr);

        return NextResponse.json({ message: 'Data refreshed successfully', output: stdout });
    } catch (error) {
        console.error('Error refreshing data:', error);
        return NextResponse.json({ error: 'Failed to refresh data' }, { status: 500 });
    }
}
