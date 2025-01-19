import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import { SearchParams, ResearchData, AnalysisResult } from '../types';

// Initialize Supabase client
const supabase = createClient(config.VITE_SUPABASE_URL, config.VITE_SUPABASE_SERVICE_ROLE_KEY);

export async function fetchResearchData(params: SearchParams): Promise<ResearchData[]> {
  try {
    // Fetch data from various sources
    const youtubeData = params.sources.includes('youtube') ? await fetchYouTubeData(params.topic) : [];
    const redditData = params.sources.includes('reddit') ? await fetchRedditData(params.topic) : [];
    const quoraData = params.sources.includes('quora') ? await fetchQuoraData(params.topic) : [];
    const allData = [...youtubeData, ...redditData, ...quoraData];

    if (allData.length === 0) {
      throw new Error('No data fetched from selected sources.');
    }

    // Store data in Supabase
    const { error } = await supabase.from('research_data').insert(allData);
    if (error) throw new Error(`Failed to store data: ${error.message}`);

    // Fetch stored data
    const { data, error: fetchError } = await supabase.from('research_data').select('*');
    if (fetchError) throw new Error(`Failed to fetch stored data: ${fetchError.message}`);

    return data || [];
  } catch (error) {
    console.error('Supabase Error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch research data. Please try again.');
  }
}

async function fetchYouTubeData(topic: string): Promise<ResearchData[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(topic)}&type=video&maxResults=10&key=${config.VITE_YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('YouTube API request failed');
    }

    const data = await response.json();
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      source: 'youtube',
      content: item.snippet.description,
      metadata: JSON.stringify({
        title: item.snippet.title,
        thumbnails: item.snippet.thumbnails,
        channelTitle: item.snippet.channelTitle,
      }),
      created_at: item.snippet.publishedAt,
    }));
  } catch (error) {
    console.error('YouTube API Error:', error);
    return [];
  }
}

async function fetchRedditData(topic: string): Promise<ResearchData[]> {
  try {
    const auth = window.btoa(`${config.VITE_REDDIT_CLIENT_ID}:${config.VITE_REDDIT_CLIENT_SECRET}`);
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Reddit access token');
    }

    const tokenData = await tokenResponse.json();
    const response = await fetch(
      `https://oauth.reddit.com/r/all/search?q=${encodeURIComponent(topic)}&sort=relevance&limit=25`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Reddit API request failed');
    }

    const data = await response.json();
    return data.data.children.map((post: any) => ({
      id: post.data.id,
      source: 'reddit',
      content: post.data.selftext || post.data.title,
      metadata: JSON.stringify({
        title: post.data.title,
        subreddit: post.data.subreddit,
        score: post.data.score,
        url: `https://reddit.com${post.data.permalink}`,
      }),
      created_at: new Date(post.data.created_utc * 1000).toISOString(),
    }));
  } catch (error) {
    console.error('Reddit API Error:', error);
    return [];
  }
}

async function fetchQuoraData(topic: string): Promise<ResearchData[]> {
  // Placeholder: Replace with logic to scrape or access Quora if necessary
  return [];
}

export async function analyzeData(data: ResearchData[], guidelines: string): Promise<AnalysisResult[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert marketing analyst. Analyze the provided research data and provide actionable insights.',
          },
          {
            role: 'user',
            content: `Analyze this research data and provide insights considering these brand guidelines: ${guidelines}\n\nData: ${JSON.stringify(data)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const analysisData = await response.json();
    return [
      {
        raw_analysis: analysisData.choices[0].message.content,
        timestamp: new Date().toISOString(),
      },
    ];
  } catch (error) {
    console.error('Analysis Error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to analyze data. Please try again.');
  }
}
