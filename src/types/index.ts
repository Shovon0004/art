export interface ResearchData {
  id: string;
  source: string;
  content: string;
  metadata: string;
  created_at: string;
}

export interface AnalysisResult {
  id: string;
  raw_analysis: string;
  timestamp: string;
}

export interface SearchParams {
  topic: string;
  sources: string[];
  brandGuidelines?: string;
}