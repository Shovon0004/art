import { config } from '../config/env';
import { SearchParams, ResearchData, AnalysisResult } from '../types';

const ASTRA_ENDPOINT = 'const ASTRA_ENDPOINT = '/api/api/rest/v2/keyspaces/artfinder';
';

export async function fetchResearchData(params: SearchParams): Promise<ResearchData[]> {
  const headers = {
    'Content-Type': 'application/json',
    'X-Cassandra-Token': config.ASTRA_TOKEN,
    'Accept': 'application/json',
    'Origin': window.location.origin,
  };

  try {
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
    const storePromises = allData.map(data => 
      fetch(`${ASTRA_ENDPOINT}/research_data`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source: data.source,
          content: data.content,
          metadata: data.metadata,
        }),
      }).then(response => {
        if (!response.ok) {
          throw new Error(`Failed to store data: ${response.statusText}`);
        }
        return response;
      })
    );

    await Promise.all(storePromises);

    // Fetch stored data from AstraDB
    const response = await fetch(`${ASTRA_ENDPOINT}/research_data`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || []; // AstraDB wraps the response in a data property
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch research data. Please try again.');
  }
}

async function fetchYouTubeData(topic: string): Promise<ResearchData[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(topic)}&type=video&maxResults=10&key=${config.YOUTUBE_API_KEY}`
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
    // Use window.btoa for browser environment
    const auth = window.btoa(`${config.REDDIT_CLIENT_ID}:${config.REDDIT_CLIENT_SECRET}`);
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
  // Note: Quora doesn't provide a public API
  return [];
}

export async function analyzeData(data: ResearchData[], guidelines: string): Promise<AnalysisResult[]> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
      'Accept': 'application/json',
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

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const analysisData = await response.json();
    const analysis = {
      raw_analysis: analysisData.choices[0].message.content,
      timestamp: new Date().toISOString(),
    };

    // Store analysis in AstraDB
    const storeResponse = await fetch(`${ASTRA_ENDPOINT}/analysis_results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cassandra-Token': config.ASTRA_TOKEN,
        'Accept': 'application/json',
        'Origin': window.location.origin,
      },
      body: JSON.stringify(analysis),
    });

    if (!storeResponse.ok) {
      throw new Error('Failed to store analysis results');
    }

    // Fetch all analysis results
    const allAnalysisResponse = await fetch(`${ASTRA_ENDPOINT}/analysis_results`, {
      headers: {
        'X-Cassandra-Token': config.ASTRA_TOKEN,
        'Accept': 'application/json',
        'Origin': window.location.origin,
      },
    });

    if (!allAnalysisResponse.ok) {
      throw new Error('Failed to fetch analysis results');
    }

    const allAnalysis = await allAnalysisResponse.json();
    return allAnalysis.data || [];
  } catch (error) {
    console.error('Analysis Error:', error);
    throw new Error('Failed to analyze data. Please try again.');
  }
}