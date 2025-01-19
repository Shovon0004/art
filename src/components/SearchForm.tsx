import React, { useState } from 'react';
import { Search, Youtube, MessageSquare, BookOpen } from 'lucide-react';
import { SearchParams } from '../types';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [topic, setTopic] = useState('');
  const [sources, setSources] = useState(['youtube', 'reddit', 'quora']);
  const [brandGuidelines, setBrandGuidelines] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ topic, sources, brandGuidelines });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-gray-700">Research Topic</label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            placeholder="Enter your research topic..."
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Data Sources</label>
        <div className="mt-2 flex flex-wrap gap-3">
          {[
            { id: 'youtube', Icon: Youtube, label: 'YouTube' },
            { id: 'reddit', Icon: MessageSquare, label: 'Reddit' },
            { id: 'quora', Icon: BookOpen, label: 'Quora' }
          ].map(({ id, Icon, label }) => (
            <label key={id} className="relative flex items-center">
              <input
                type="checkbox"
                checked={sources.includes(id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSources([...sources, id]);
                  } else {
                    setSources(sources.filter(s => s !== id));
                  }
                }}
                className="sr-only peer"
              />
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border peer-checked:bg-indigo-100 peer-checked:border-indigo-500 cursor-pointer">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="guidelines" className="block text-sm font-medium text-gray-700">Brand Guidelines</label>
        <textarea
          id="guidelines"
          value={brandGuidelines}
          onChange={(e) => setBrandGuidelines(e.target.value)}
          rows={3}
          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Enter any brand guidelines or specific requirements..."
        />
      </div>

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Start Research
      </button>
    </form>
  );
}