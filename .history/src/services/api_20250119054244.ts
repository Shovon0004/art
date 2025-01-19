import { config } from '../config/env';
import { SearchParams, ResearchData, AnalysisResult } from '../types';

const ASTRA_ENDPOINT = 'https://shreyas2-0.apps.astra.datastax.com/api/rest/v2/keyspaces/artfinder';

export async function fetchResearchData(params: SearchParams): Promise<ResearchData[]> {
  const headers = {
    'Content-Type': 'application/json',
    'X-Cassandra-Token': config.ASTRA_TOKEN,
  };

  // Fetch YouTube data
  const youtubeData = params.sources.includes('youtube') 
    ? await fetchYouTubeData(params.topic)
    : [];

  // Fetch Reddit data
  const redditData = params.sources.includes('reddit')
    ? await fetchRedditData(params.topic)
    : [];

  // Fetch Quora data (if implemented)
  const quoraData = params.sources.includes('quora')
    ? await fetchQuoraData(params.topic)
    : [];

  // Combine all data
  const allData = [...youtubeData, ...redditData, ...quoraData];

  // Store in AstraDB
  for (const data of allData) {
    await fetch(`${ASTRA_ENDPOINT}/research_data`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: data.source,
        content: data.content,
        metadata: data.metadata,
      }),
    });
  }

  // Fetch stored data from AstraDB
  const response = await fetch(`${ASTRA_ENDPOINT}/research_data`, {
    headers,
  });
  
  return response.json();
}

async function fetchYouTubeData(topic: string): Promise<ResearchData[]> {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(topic)}&key=${config.YOUTUBE_API_KEY}`
  );
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
}

async function fetchRedditData(topic: string): Promise<ResearchData[]> {
  // First, get access token using browser's btoa instead of Buffer
  const auth = btoa(`${config.REDDIT_CLIENT_ID}:${config.REDDIT_CLIENT_SECRET}`);
  const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const tokenData = await tokenResponse.json();

  // Fetch Reddit posts
  const response = await fetch(
    `https://oauth.reddit.com/r/all/search?q=${encodeURIComponent(topic)}&sort=relevance&limit=25`,
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    }
  );
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
}

async function fetchQuoraData(topic: string): Promise<ResearchData[]> {
  // Note: Quora doesn't provide a public API
  // This is a placeholder for future implementation
  return [];
}

export async function analyzeData(data: ResearchData[], guidelines: string): Promise<AnalysisResult[]> {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
  };

  // Analyze data using OpenAI
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert marketing analyst. Analyze the provided research data and provide actionable insights."
        },
        {
          role: "user",
          content: `Analyze this research data and provide insights considering these brand guidelines: ${guidelines}\n\nData: ${JSON.stringify(data)}`
        }
      ]
    })
  });

  const analysisData = await response.json();
  const analysis = {
    raw_analysis: analysisData.choices[0].message.content,
    timestamp: new Date().toISOString(),
  };

  // Store analysis in AstraDB
  await fetch(`${ASTRA_ENDPOINT}/analysis_results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Cassandra-Token': config.ASTRA_TOKEN,
    },
    body: JSON.stringify(analysis),
  });

  // Fetch all analysis results
  const allAnalysisResponse = await fetch(`${ASTRA_ENDPOINT}/analysis_results`, {
    headers: {
      'X-Cassandra-Token': config.ASTRA_TOKEN,
    },
  });

  return allAnalysisResponse.json();
}