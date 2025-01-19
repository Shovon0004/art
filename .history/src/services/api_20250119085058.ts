return data.items.map((item: any) => ({
  id: item.id.videoId, // Ensure this matches the `id` column type (text).
  source: 'youtube',
  content: item.snippet.description || '', // Ensure this is a string.
  metadata: {
    title: item.snippet.title,
    thumbnails: item.snippet.thumbnails,
    channelTitle: item.snippet.channelTitle,
  },
  created_at: item.snippet.publishedAt || new Date().toISOString(), // Ensure a valid timestamp.
}));
