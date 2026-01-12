'use client';

import { useState } from 'react';
import { Search, MapPin, Sliders } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string, location: string) => void;
  onFilterToggle: () => void;
}

export default function SearchBar({ onSearch, onFilterToggle }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, location);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-5 flex flex-col md:flex-row gap-4 border border-white/50"
    >
      {/* Search Input */}
      <div className="flex-1 flex items-center border-2 border-gray-200 rounded-xl px-5 py-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all bg-white">
        <Search className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
        <input
          type="text"
          placeholder="Job title, keywords, or company"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 outline-none text-gray-900 placeholder-gray-400 font-medium"
        />
      </div>

      {/* Location Input */}
      <div className="flex-1 flex items-center border-2 border-gray-200 rounded-xl px-5 py-4 focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-100 transition-all bg-white">
        <MapPin className="h-5 w-5 text-purple-600 mr-3 flex-shrink-0" />
        <input
          type="text"
          placeholder="City, state, or remote"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1 outline-none text-gray-900 placeholder-gray-400 font-medium"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onFilterToggle}
          className="flex items-center justify-center border-2 border-gray-200 rounded-xl px-5 py-4 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all bg-white"
          aria-label="Toggle filters"
        >
          <Sliders className="h-5 w-5" />
        </button>
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all whitespace-nowrap"
        >
          Search Jobs
        </button>
      </div>
    </form>
  );
}


