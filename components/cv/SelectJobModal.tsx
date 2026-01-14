'use client';

import { useState, useEffect } from 'react';
import { X, Search, Briefcase, MapPin, Clock, Bookmark } from 'lucide-react';
import { getJobsForEvaluation } from '@/lib/api';

interface JobForEvaluation {
  id: string;
  title: string;
  company_name: string;
  location: string;
  time_on_sight: number;
}

interface SelectJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (jobId: string, jobTitle: string) => void;
  accessToken?: string;
}

export default function SelectJobModal({ isOpen, onClose, onSelect, accessToken }: SelectJobModalProps) {
  const [viewedJobs, setViewedJobs] = useState<JobForEvaluation[]>([]);
  const [savedJobs, setSavedJobs] = useState<JobForEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'viewed' | 'saved'>('viewed');

  useEffect(() => {
    if (isOpen && accessToken) {
      loadJobs();
    }
  }, [isOpen, accessToken]);

  const loadJobs = async () => {
    if (!accessToken) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await getJobsForEvaluation(accessToken);
      setViewedJobs(data.viewed_jobs || []);
      setSavedJobs(data.saved_jobs || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError('Không thể tải danh sách công việc');
    } finally {
      setIsLoading(false);
    }
  };

  const currentJobs = activeTab === 'viewed' ? viewedJobs : savedJobs;
  
  const filteredJobs = currentJobs.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.company_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectJob = (job: JobForEvaluation) => {
    onSelect(job.id, `${job.title} - ${job.company_name}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🎯 Chọn công việc để đánh giá
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-500">
            CV của bạn sẽ được đánh giá dựa trên yêu cầu của công việc này
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('viewed')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'viewed'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Đã xem gần đây</span>
              {viewedJobs.length > 0 && (
                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                  {viewedJobs.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'saved'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Bookmark className="h-4 w-4" />
              <span>Đã lưu</span>
              {savedJobs.length > 0 && (
                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                  {savedJobs.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm công việc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none"
            />
          </div>
        </div>

        {/* Job List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-3 text-sm text-gray-500">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={loadJobs}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Thử lại
              </button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {search ? 'Không tìm thấy công việc' : activeTab === 'viewed' ? 'Chưa có công việc đã xem' : 'Chưa có công việc đã lưu'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => handleSelectJob(job)}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-1">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{job.company_name}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                        {activeTab === 'viewed' && job.time_on_sight > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Đã xem {Math.floor(job.time_on_sight / 60)}m
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Briefcase className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

