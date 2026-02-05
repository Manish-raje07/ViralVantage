/**
 * Seed Script - Populates MongoDB with realistic social media analytics data
 * Run with: npx ts-node scripts/seed-data.ts
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vishwakarmaakashav17:AkashPython123@pythoncluster0.t9pop.mongodb.net/social-media-dashboard?retryWrites=true&w=majority&appName=pythoncluster0';

interface PlatformMetrics {
  platform: string;
  followers: number;
  following: number;
  posts: number;
  engagement: number;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  profileViews: number;
  websiteClicks: number;
  growthRate: number;
  icon: string;
  color: string;
  username: string;
  verified: boolean;
  lastUpdated: Date;
}

interface Post {
  id: string;
  platform: string;
  type: 'image' | 'video' | 'reel' | 'story' | 'carousel' | 'text' | 'thread' | 'short';
  content: string;
  hashtags: string[];
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  publishedAt: Date;
  thumbnail?: string;
  views?: number;
}

interface DailyMetric {
  date: Date;
  platform: string;
  followers: number;
  engagement: number;
  reach: number;
  impressions: number;
  posts: number;
}

interface AudienceData {
  platform: string;
  demographics: {
    age: { range: string; percentage: number }[];
    gender: { type: string; percentage: number }[];
    locations: { country: string; city?: string; percentage: number }[];
  };
  interests: { name: string; percentage: number }[];
  activeHours: { hour: number; engagement: number }[];
  activeDays: { day: string; engagement: number }[];
}

// Generate realistic random number with variance
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate engagement rate (typically 1-10% for social media)
function generateEngagementRate(followers: number): number {
  const baseRate = followers > 100000 ? 2.5 : followers > 10000 ? 4.5 : 7.5;
  return +(baseRate + (Math.random() - 0.5) * 2).toFixed(2);
}

// Platform configurations
const platformConfigs = [
  {
    platform: 'instagram',
    username: '@socialmedia_dashboard',
    icon: 'Instagram',
    color: '#E4405F',
    followersRange: [45000, 55000],
    postsRange: [280, 320],
    verified: true,
  },
  {
    platform: 'twitter',
    username: '@sm_dashboard',
    icon: 'Twitter',
    color: '#1DA1F2',
    followersRange: [22000, 28000],
    postsRange: [1500, 2000],
    verified: true,
  },
  {
    platform: 'facebook',
    username: 'SocialMediaDashboard',
    icon: 'Facebook',
    color: '#1877F2',
    followersRange: [35000, 45000],
    postsRange: [400, 500],
    verified: true,
  },
  {
    platform: 'youtube',
    username: '@SMDashboard',
    icon: 'Youtube',
    color: '#FF0000',
    followersRange: [125000, 175000],
    postsRange: [180, 220],
    verified: true,
  },
  {
    platform: 'linkedin',
    username: 'social-media-dashboard',
    icon: 'Linkedin',
    color: '#0A66C2',
    followersRange: [12000, 18000],
    postsRange: [150, 200],
    verified: false,
  },
  {
    platform: 'tiktok',
    username: '@smdashboard',
    icon: 'Music2',
    color: '#000000',
    followersRange: [85000, 120000],
    postsRange: [350, 450],
    verified: true,
  },
  {
    platform: 'reddit',
    username: 'u/SMDashboard',
    icon: 'MessageCircle',
    color: '#FF4500',
    followersRange: [8000, 12000],
    postsRange: [200, 300],
    verified: false,
  },
  {
    platform: 'pinterest',
    username: 'smdashboard',
    icon: 'Pin',
    color: '#BD081C',
    followersRange: [18000, 25000],
    postsRange: [500, 700],
    verified: false,
  },
];

// Content templates for different platforms
const contentTemplates = {
  instagram: [
    "Transforming data into insights 📊 #analytics #socialmedia #growth",
    "Behind the scenes of our dashboard development 🚀 #tech #startup",
    "Your engagement metrics, visualized beautifully ✨ #dataviz #marketing",
    "New feature alert! Real-time analytics now live 🎉 #product #update",
    "Building the future of social media management 💡 #innovation",
  ],
  twitter: [
    "Just shipped a major update to our analytics engine! 🚀 Thread below 👇",
    "Hot take: engagement rate > follower count. Here's why...",
    "We analyzed 1M posts across all platforms. The results are fascinating 📊",
    "New: Cross-platform comparison now available! Compare your IG, TikTok, and YouTube in one view",
    "Pro tip: Post when your audience is most active. Check your analytics to find the sweet spot ⏰",
  ],
  youtube: [
    "How to 10x Your Social Media Engagement | Complete Guide",
    "I Analyzed My Analytics for 30 Days - Here's What I Learned",
    "Social Media Dashboard Tutorial | Getting Started",
    "The Algorithm Secrets No One Tells You About",
    "Monthly Analytics Review - February 2026",
  ],
  tiktok: [
    "POV: You finally understand your analytics 📈 #analytics #growth",
    "Wait for the engagement spike at the end 😱 #viral #socialmedia",
    "Replying to @user here's how to read your metrics #tutorial",
    "This one hack increased my reach by 300% 🚀 #growthhack",
    "Day in my life as a social media manager 💼 #smm #dayinmylife",
  ],
  facebook: [
    "Exciting news! Our new dashboard features are now live. Check out what's new 👇",
    "Understanding your audience has never been easier. Try our demographic insights!",
    "Weekly tip: Consistency beats virality. Keep posting quality content!",
    "Join our community of 10,000+ social media managers!",
    "Case study: How @brand increased their engagement by 150% using data-driven strategies",
  ],
  linkedin: [
    "I've been building social media analytics tools for 5 years. Here are my top lessons learned:",
    "The future of social media management is AI-powered. Here's what that means for marketers.",
    "Proud to announce we've reached 10,000 active users! Thank you for your support.",
    "Data-driven marketing isn't optional anymore. It's essential. Here's why:",
    "Hiring: We're looking for passionate data engineers to join our team!",
  ],
  reddit: [
    "[OC] Analyzed 6 months of my social media data across all platforms",
    "What metrics do you prioritize when measuring success?",
    "Built a dashboard to track all my social media - here's the tech stack",
    "Unpopular opinion: Follower count is a vanity metric",
    "AMA: I've managed social media for Fortune 500 companies. Ask me anything!",
  ],
  pinterest: [
    "30 Social Media Post Ideas for February 📌",
    "Analytics Dashboard Inspiration | Data Visualization",
    "Content Calendar Template | Free Download",
    "Best Times to Post on Each Platform | Infographic",
    "Social Media Trends 2026 | What's Next",
  ],
};

const hashtagsByPlatform: Record<string, string[]> = {
  instagram: ['#analytics', '#socialmedia', '#growth', '#marketing', '#dataviz', '#business', '#entrepreneur', '#digitalmarketing'],
  twitter: ['#SocialMedia', '#Analytics', '#MarTech', '#DigitalMarketing', '#DataDriven', '#GrowthHacking'],
  youtube: [],
  tiktok: ['#fyp', '#viral', '#analytics', '#growth', '#socialmediamanager', '#marketing'],
  facebook: [],
  linkedin: ['#SocialMediaMarketing', '#Analytics', '#DataDriven', '#MarketingStrategy', '#B2B'],
  reddit: [],
  pinterest: ['#socialmedia', '#marketing', '#analytics', '#contentcreator', '#business'],
};

function generatePlatformMetrics(config: typeof platformConfigs[0]): PlatformMetrics {
  const followers = randomInRange(config.followersRange[0], config.followersRange[1]);
  const engagement = generateEngagementRate(followers);
  
  return {
    platform: config.platform,
    followers,
    following: randomInRange(500, 2000),
    posts: randomInRange(config.postsRange[0], config.postsRange[1]),
    engagement,
    reach: Math.floor(followers * (0.3 + Math.random() * 0.4)),
    impressions: Math.floor(followers * (1.5 + Math.random() * 1.5)),
    likes: Math.floor(followers * (engagement / 100) * 0.8),
    comments: Math.floor(followers * (engagement / 100) * 0.15),
    shares: Math.floor(followers * (engagement / 100) * 0.05),
    saves: Math.floor(followers * (engagement / 100) * 0.1),
    profileViews: randomInRange(1000, 5000),
    websiteClicks: randomInRange(100, 800),
    growthRate: +(Math.random() * 8 - 2).toFixed(2), // -2% to +6%
    icon: config.icon,
    color: config.color,
    username: config.username,
    verified: config.verified,
    lastUpdated: new Date(),
  };
}

function generatePosts(platform: string, count: number): Post[] {
  const posts: Post[] = [];
  const templates = contentTemplates[platform as keyof typeof contentTemplates] || contentTemplates.instagram;
  const hashtags = hashtagsByPlatform[platform] || [];
  
  const types: Post['type'][] = platform === 'youtube' ? ['video', 'short'] :
    platform === 'tiktok' ? ['video', 'reel'] :
    platform === 'instagram' ? ['image', 'video', 'reel', 'carousel', 'story'] :
    platform === 'twitter' ? ['text', 'image', 'thread'] :
    ['image', 'video', 'text'];

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const likes = randomInRange(100, 15000);
    const comments = Math.floor(likes * (0.02 + Math.random() * 0.08));
    const shares = Math.floor(likes * (0.01 + Math.random() * 0.05));
    const saves = Math.floor(likes * (0.005 + Math.random() * 0.03));
    const reach = Math.floor(likes * (5 + Math.random() * 15));
    
    posts.push({
      id: `${platform}-${Date.now()}-${i}`,
      platform,
      type: types[Math.floor(Math.random() * types.length)],
      content: templates[Math.floor(Math.random() * templates.length)],
      hashtags: hashtags.slice(0, Math.floor(Math.random() * 5) + 2),
      likes,
      comments,
      shares,
      saves,
      reach,
      impressions: Math.floor(reach * (1.2 + Math.random() * 0.5)),
      engagementRate: +((likes + comments + shares + saves) / reach * 100).toFixed(2),
      publishedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      views: platform === 'youtube' || platform === 'tiktok' ? randomInRange(1000, 100000) : undefined,
    });
  }
  
  return posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

function generateDailyMetrics(platform: string, days: number): DailyMetric[] {
  const metrics: DailyMetric[] = [];
  let baseFollowers = randomInRange(10000, 50000);
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    // Simulate organic growth with some variance
    baseFollowers += randomInRange(-50, 200);
    
    metrics.push({
      date,
      platform,
      followers: baseFollowers,
      engagement: +(3 + Math.random() * 4).toFixed(2),
      reach: randomInRange(5000, 25000),
      impressions: randomInRange(15000, 75000),
      posts: randomInRange(0, 5),
    });
  }
  
  return metrics;
}

function generateAudienceData(platform: string): AudienceData {
  return {
    platform,
    demographics: {
      age: [
        { range: '13-17', percentage: randomInRange(5, 12) },
        { range: '18-24', percentage: randomInRange(25, 35) },
        { range: '25-34', percentage: randomInRange(30, 40) },
        { range: '35-44', percentage: randomInRange(12, 20) },
        { range: '45-54', percentage: randomInRange(5, 12) },
        { range: '55+', percentage: randomInRange(3, 8) },
      ],
      gender: [
        { type: 'Male', percentage: randomInRange(40, 55) },
        { type: 'Female', percentage: randomInRange(40, 55) },
        { type: 'Other', percentage: randomInRange(1, 5) },
      ],
      locations: [
        { country: 'United States', city: 'New York', percentage: randomInRange(20, 30) },
        { country: 'United Kingdom', city: 'London', percentage: randomInRange(12, 18) },
        { country: 'India', city: 'Mumbai', percentage: randomInRange(10, 16) },
        { country: 'Canada', city: 'Toronto', percentage: randomInRange(6, 12) },
        { country: 'Australia', city: 'Sydney', percentage: randomInRange(5, 10) },
        { country: 'Germany', city: 'Berlin', percentage: randomInRange(4, 8) },
        { country: 'Brazil', city: 'São Paulo', percentage: randomInRange(4, 8) },
        { country: 'Other', percentage: randomInRange(15, 25) },
      ],
    },
    interests: [
      { name: 'Technology', percentage: randomInRange(60, 80) },
      { name: 'Marketing', percentage: randomInRange(50, 70) },
      { name: 'Business', percentage: randomInRange(45, 65) },
      { name: 'Design', percentage: randomInRange(30, 50) },
      { name: 'Photography', percentage: randomInRange(25, 45) },
      { name: 'Travel', percentage: randomInRange(20, 40) },
      { name: 'Fitness', percentage: randomInRange(15, 35) },
      { name: 'Food', percentage: randomInRange(15, 30) },
    ],
    activeHours: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      engagement: hour >= 9 && hour <= 21 ? randomInRange(50, 100) : randomInRange(10, 40),
    })),
    activeDays: [
      { day: 'Monday', engagement: randomInRange(70, 90) },
      { day: 'Tuesday', engagement: randomInRange(75, 95) },
      { day: 'Wednesday', engagement: randomInRange(80, 100) },
      { day: 'Thursday', engagement: randomInRange(75, 95) },
      { day: 'Friday', engagement: randomInRange(65, 85) },
      { day: 'Saturday', engagement: randomInRange(55, 75) },
      { day: 'Sunday', engagement: randomInRange(50, 70) },
    ],
  };
}

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('social-media-dashboard');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await db.collection('platforms').deleteMany({});
    await db.collection('posts').deleteMany({});
    await db.collection('dailyMetrics').deleteMany({});
    await db.collection('audience').deleteMany({});
    await db.collection('insights').deleteMany({});
    
    // Generate and insert platform metrics
    console.log('\n📊 Generating platform metrics...');
    const platformMetrics: PlatformMetrics[] = [];
    for (const config of platformConfigs) {
      const metrics = generatePlatformMetrics(config);
      platformMetrics.push(metrics);
      console.log(`  ✓ ${config.platform}: ${metrics.followers.toLocaleString()} followers`);
    }
    await db.collection('platforms').insertMany(platformMetrics);
    
    // Generate and insert posts
    console.log('\n📝 Generating posts...');
    let allPosts: Post[] = [];
    for (const config of platformConfigs) {
      const posts = generatePosts(config.platform, 50);
      allPosts = allPosts.concat(posts);
      console.log(`  ✓ ${config.platform}: ${posts.length} posts`);
    }
    await db.collection('posts').insertMany(allPosts);
    
    // Generate and insert daily metrics (90 days)
    console.log('\n📈 Generating daily metrics (90 days)...');
    let allDailyMetrics: DailyMetric[] = [];
    for (const config of platformConfigs) {
      const dailyMetrics = generateDailyMetrics(config.platform, 90);
      allDailyMetrics = allDailyMetrics.concat(dailyMetrics);
    }
    await db.collection('dailyMetrics').insertMany(allDailyMetrics);
    console.log(`  ✓ ${allDailyMetrics.length} daily metric records`);
    
    // Generate and insert audience data
    console.log('\n👥 Generating audience data...');
    const audienceData: AudienceData[] = [];
    for (const config of platformConfigs) {
      audienceData.push(generateAudienceData(config.platform));
    }
    await db.collection('audience').insertMany(audienceData);
    console.log(`  ✓ ${audienceData.length} audience profiles`);
    
    // Calculate totals
    const totalFollowers = platformMetrics.reduce((sum, p) => sum + p.followers, 0);
    const totalReach = platformMetrics.reduce((sum, p) => sum + p.reach, 0);
    const avgEngagement = (platformMetrics.reduce((sum, p) => sum + p.engagement, 0) / platformMetrics.length).toFixed(2);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Total Followers: ${totalFollowers.toLocaleString()}`);
    console.log(`   Total Reach: ${totalReach.toLocaleString()}`);
    console.log(`   Avg Engagement: ${avgEngagement}%`);
    console.log(`   Platforms: ${platformMetrics.length}`);
    console.log(`   Posts: ${allPosts.length}`);
    console.log(`   Daily Records: ${allDailyMetrics.length}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the seed
seedDatabase().catch(console.error);
