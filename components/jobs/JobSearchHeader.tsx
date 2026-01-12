'use client';

import { Search, MapPin } from 'lucide-react';

interface JobSearchHeaderProps {
  searchQuery: string;
  location: string;
  onSearchQueryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  title?: string;
}

const JobSearchHeader = ({
  searchQuery,
  location,
  onSearchQueryChange,
  onLocationChange,
  onSearch,
  title = 'Tìm kiếm việc làm',
}: JobSearchHeaderProps) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h1 className="text-xl font-bold text-gray-900 mb-3">{title}</h1>

        <form onSubmit={onSearch}>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Tìm theo tiêu đề, công ty, kỹ năng..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Location Input */}
            <div className="sm:w-48 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                placeholder="Địa điểm"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Search className="h-5 w-5" />
              Tìm kiếm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobSearchHeader;

