import { MongoClient, Db, Collection, Document } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // In development, use a global variable to preserve connection across hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Database instance
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db('social-media-dashboard');
}

// Collection helpers
export async function getCollection<T extends Document>(
  collectionName: string
): Promise<Collection<T>> {
  const db = await getDatabase();
  return db.collection<T>(collectionName);
}

// Collection names
export const COLLECTIONS = {
  POSTS: 'posts',
  ANALYTICS: 'analytics',
  INSIGHTS: 'insights',
  QUERIES: 'queries',
} as const;

// Initialize collections with indexes
export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();

  // Posts collection indexes
  const postsCollection = db.collection(COLLECTIONS.POSTS);
  await postsCollection.createIndex({ platform: 1, postId: 1 }, { unique: true });
  await postsCollection.createIndex({ publishedAt: -1 });
  await postsCollection.createIndex({ type: 1 });
  await postsCollection.createIndex({ 'metrics.engagementRate': -1 });

  // Analytics collection indexes
  const analyticsCollection = db.collection(COLLECTIONS.ANALYTICS);
  await analyticsCollection.createIndex({ platform: 1, date: -1 });
  await analyticsCollection.createIndex({ date: -1 });

  // Insights collection indexes
  const insightsCollection = db.collection(COLLECTIONS.INSIGHTS);
  await insightsCollection.createIndex({ type: 1, generatedAt: -1 });
  await insightsCollection.createIndex({ validUntil: 1 });

  // Queries collection indexes
  const queriesCollection = db.collection(COLLECTIONS.QUERIES);
  await queriesCollection.createIndex({ timestamp: -1 });

  console.log('Database indexes created successfully');
}

// Export the client promise for direct access
export default clientPromise;
