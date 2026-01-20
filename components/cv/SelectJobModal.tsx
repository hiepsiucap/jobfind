'use client';

import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { getJobsForEvaluation } from '@/lib/api';

interface JobForEvaluation {
  id: string;
  title: string;
  company_name?: string;
  companyName?: string;
  location: string;
  time_on_sight?: number;
  timeOnSight?: number;
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
    if (!accessToken) {
      setError('Chưa đăng nhập');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await getJobsForEvaluation(accessToken);
      setViewedJobs(data.viewed_jobs || data.viewedJobs || []);
      setSavedJobs(data.saved_jobs || data.savedJobs || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể tải danh sách công việc';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const currentJobs = activeTab === 'viewed' ? viewedJobs : savedJobs;
  const getCompanyName = (job: JobForEvaluation) => job.company_name || job.companyName || '';

  const filteredJobs = currentJobs.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    getCompanyName(job).toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectJob = (job: JobForEvaluation) => {
    onSelect(job.id, `${job.title} - ${getCompanyName(job)}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[70vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Chọn công việc để đánh giá</h2>
            <p className="text-xs text-gray-500 mt-0.5">So sánh CV với yêu cầu công việc</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-3 gap-1">
          <button
            onClick={() => setActiveTab('viewed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'viewed'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Đã xem ({viewedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'saved'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Đã lưu ({savedJobs.length})
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border-0 rounded-lg text-sm placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200 outline-none transition-all"
            />
          </div>
        </div>

        {/* Job List */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500 mb-3">{error}</p>
              <button
                onClick={loadJobs}
                className="text-xs text-gray-600 hover:text-gray-900 underline"
              >
                Thử lại
              </button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">
                {search ? 'Không tìm thấy' : activeTab === 'viewed' ? 'Chưa có công việc đã xem' : 'Chưa có công việc đã lưu'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => handleSelectJob(job)}
                  className="w-full p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                >
                  <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700 line-clamp-1">
                    {job.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {getCompanyName(job)} · {job.location}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
