import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Please add your Gemini API key to .env.local');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize the model
const model: GenerativeModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

// System prompt for social media analytics context
const SYSTEM_PROMPT = `You are an expert social media analytics assistant. You help users understand their social media performance and provide actionable insights.

You have access to the user's social media data including:
- Posts across platforms (Instagram, Twitter, Facebook, TikTok)
- Post types (Reels, Carousels, Static posts, Videos, Stories)
- Metrics (likes, comments, shares, reach, impressions, engagement rate)
- Historical trends and patterns

When answering questions:
1. Be specific and data-driven
2. Provide actionable recommendations
3. Explain the "why" behind insights
4. Use numbers and percentages when available
5. Be concise but comprehensive

Format your responses with clear structure using markdown when appropriate.`;

// Natural language query for analytics
export async function queryAnalytics(
  userQuery: string,
  analyticsContext: Record<string, unknown>
): Promise<string> {
  try {
    const contextString = JSON.stringify(analyticsContext, null, 2);
    
    const prompt = `${SYSTEM_PROMPT}

Current Analytics Data:
${contextString}

User Question: ${userQuery}

Provide a helpful, data-driven response:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to process query. Please try again.');
  }
}

// Generate automated insights from analytics data
export async function generateInsights(
  analyticsData: Record<string, unknown>
): Promise<{
  insights: Array<{
    type: string;
    title: string;
    content: string;
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
  }>;
}> {
  try {
    const prompt = `${SYSTEM_PROMPT}

Analyze the following social media analytics data and generate strategic insights:

${JSON.stringify(analyticsData, null, 2)}

Generate exactly 5 insights in the following JSON format:
{
  "insights": [
    {
      "type": "best_time | content_type | viral_factor | recommendation | trend",
      "title": "Short insight title",
      "content": "Detailed explanation with specific data points",
      "priority": "high | medium | low",
      "actionable": true/false
    }
  ]
}

Focus on:
1. Best performing content types
2. Optimal posting times
3. Engagement patterns
4. Growth opportunities
5. Strategic recommendations

Return ONLY valid JSON, no markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Gemini insights error:', error);
    // Return default insights on error
    return {
      insights: [
        {
          type: 'recommendation',
          title: 'Analysis in Progress',
          content: 'We are analyzing your data to generate personalized insights. Please check back shortly.',
          priority: 'medium',
          actionable: false,
        },
      ],
    };
  }
}

// Generate content recommendations
export async function generateContentRecommendations(
  topPosts: Record<string, unknown>[],
  targetPlatform: string
): Promise<string[]> {
  try {
    const prompt = `Based on these top-performing posts, suggest 5 content ideas for ${targetPlatform}:

Top Posts:
${JSON.stringify(topPosts, null, 2)}

Return exactly 5 content ideas as a JSON array of strings:
["idea 1", "idea 2", "idea 3", "idea 4", "idea 5"]

Make recommendations specific, actionable, and aligned with what performed well.
Return ONLY the JSON array, no other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return ['Create engaging visual content', 'Share behind-the-scenes moments', 'Post user-generated content', 'Try trending formats', 'Engage with your audience'];
  } catch (error) {
    console.error('Gemini recommendations error:', error);
    return ['Create engaging visual content', 'Share behind-the-scenes moments', 'Post user-generated content', 'Try trending formats', 'Engage with your audience'];
  }
}

// Analyze viral factors of a post
export async function analyzeViralFactors(
  post: Record<string, unknown>
): Promise<{
  viralScore: number;
  factors: string[];
  suggestions: string[];
}> {
  try {
    const prompt = `Analyze this social media post for viral potential:

${JSON.stringify(post, null, 2)}

Return a JSON object with:
{
  "viralScore": 0-100,
  "factors": ["list of factors that contributed to performance"],
  "suggestions": ["list of improvements for future posts"]
}

Return ONLY valid JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      viralScore: 50,
      factors: ['Content quality', 'Posting time', 'Hashtag usage'],
      suggestions: ['Experiment with different formats', 'Engage with comments quickly'],
    };
  } catch (error) {
    console.error('Gemini viral analysis error:', error);
    return {
      viralScore: 50,
      factors: ['Unable to analyze at this time'],
      suggestions: ['Try again later'],
    };
  }
}

export default model;
