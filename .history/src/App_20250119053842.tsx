import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import SearchForm from './components/SearchForm';
import Dashboard from './components/Dashboard';
import { SearchParams, ResearchData, AnalysisResult } from './types';
import { fetchResearchData, analyzeData } from './services/api';

function App() {
  const [researchData, setResearchData] = useState<ResearchData[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (params: SearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchResearchData(params);
      setResearchData(data);
      
      const analysis = await analyzeData(data, params.brandGuidelines || '');
      setAnalysisResults(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">ART Finder</h1>
          </div>
          <p className="text-lg text-gray-600">
            Automated Research and Trigger Finder for Data-Driven Marketing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <SearchForm onSearch={handleSearch} />
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              researchData.length > 0 && (
                <Dashboard
                  researchData={researchData}
                  analysisResults={analysisResults}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;