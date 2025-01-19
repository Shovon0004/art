import React, { useState } from 'react';
import { BarChart, PieChart, Activity, Zap } from 'lucide-react';
import { ResearchData, AnalysisResult } from '../types';

interface DashboardProps {
  researchData: ResearchData[];
  analysisResults: AnalysisResult[];
}

export default function Dashboard({ researchData, analysisResults }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('insights');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
            activeTab === 'insights' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Zap className="h-5 w-5" aria-hidden="true" />
          <span>Key Insights</span>
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
            activeTab === 'metrics' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Activity className="h-5 w-5" aria-hidden="true" />
          <span>Metrics</span>
        </button>
      </div>

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Top Pain Points</h3>
              <ul className="space-y-3">
                {researchData.slice(0, 5).map((data, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{data.content.slice(0, 100)}...</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Recommended Solutions</h3>
              <ul className="space-y-3">
                {analysisResults.slice(0, 5).map((result, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{result.raw_analysis.slice(0, 100)}...</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Content Strategy Suggestions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Hook Ideas', 'CTAs', 'Content Formats'].map((category, index) => (
                <div key={index} className="bg-white bg-opacity-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
                  <ul className="space-y-2">
                    {[1, 2, 3].map((item) => (
                      <li key={item} className="text-gray-700 text-sm">
                        • Example suggestion {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Data Sources Distribution</h3>
                <PieChart className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">Chart visualization would go here</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Sentiment Analysis</h3>
                <BarChart className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">Chart visualization would go here</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}