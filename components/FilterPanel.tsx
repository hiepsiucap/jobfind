'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

export default function FilterPanel({ isOpen, onClose, onApply }: FilterPanelProps) {
  const [filters, setFilters] = useState({
    jobType: [] as string[],
    experience: [] as string[],
    remote: false,
    salary: { min: '', max: '' },
  });

  const handleCheckbox = (category: 'jobType' | 'experience', value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((item) => item !== value)
        : [...prev[category], value],
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      jobType: [],
      experience: [],
      remote: false,
      salary: { min: '', max: '' },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 mb-8 shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h3 className="text-2xl font-display font-bold text-gray-900">Filters</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"
          aria-label="Close filters"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="space-y-8">
        {/* Job Type */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h4 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            Job Type
          </h4>
          <div className="space-y-3">
            {['full-time', 'part-time', 'contract', 'internship'].map((type) => (
              <label key={type} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.jobType.includes(type)}
                  onChange={() => handleCheckbox('jobType', type)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded-md focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-3 text-gray-700 font-medium capitalize group-hover:text-blue-600 transition-colors">
                  {type.replace('-', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h4 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
            Experience Level
          </h4>
          <div className="space-y-3">
            {['entry', 'mid', 'senior', 'lead'].map((level) => (
              <label key={level} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.experience.includes(level)}
                  onChange={() => handleCheckbox('experience', level)}
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded-md focus:ring-purple-500 focus:ring-2"
                />
                <span className="ml-3 text-gray-700 font-medium capitalize group-hover:text-purple-600 transition-colors">{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Remote Work */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-100">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.remote}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, remote: e.target.checked }))
              }
              className="w-5 h-5 text-blue-600 border-gray-300 rounded-md focus:ring-blue-500 focus:ring-2"
            />
            <div className="ml-3 flex items-center gap-2">
              <span className="text-2xl">🌍</span>
              <span className="text-gray-700 font-semibold group-hover:text-blue-600 transition-colors">Remote Only</span>
            </div>
          </label>
        </div>

        {/* Salary Range */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h4 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
            Salary Range
          </h4>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 mb-2 block">Minimum</label>
              <input
                type="number"
                placeholder="Min"
                value={filters.salary.min}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    salary: { ...prev.salary, min: e.target.value },
                  }))
                }
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none font-medium transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 mb-2 block">Maximum</label>
              <input
                type="number"
                placeholder="Max"
                value={filters.salary.max}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    salary: { ...prev.salary, max: e.target.value },
                  }))
                }
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none font-medium transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8 pt-8 border-t-2 border-gray-200">
        <button
          onClick={handleReset}
          className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}


