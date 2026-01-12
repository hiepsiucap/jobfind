'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import JobCard from '@/components/JobCard';
import { fetchJobs } from '@/lib/api';
import { Job } from '@/types';
import { Search, X, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import {
  JobFilterSidebar,
  JobSearchHeader,
  JobFilterTags,
  MobileFilterDrawer,
  JOB_TYPES,
  EXPERIENCE_LEVELS,
  SALARY_RANGES,
} from '@/components/jobs';

// Helper to extract unique values from jobs
function extractUniqueLocations(jobs: Job[]): string[] {
  const locations = new Set<string>();
  jobs.forEach(job => {
    if (job.location) {
      // Normalize location (take first part before comma for city)
      const city = job.location.split(',')[0].trim();
      if (city && city.toLowerCase() !== 'remote') {
        locations.add(city);
      }
    }
  });
  return Array.from(locations).sort();
}

function extractUniqueTechs(jobs: Job[]): string[] {
  const techCount = new Map<string, number>();
  jobs.forEach(job => {
    if (job.jobTech && Array.isArray(job.jobTech)) {
      job.jobTech.forEach(tech => {
        const normalizedTech = tech.trim();
        if (normalizedTech) {
          techCount.set(normalizedTech, (techCount.get(normalizedTech) || 0) + 1);
        }
      });
    }
  });
  // Sort by frequency (most common first)
  return Array.from(techCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tech]) => tech);
}

function JobsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL params
  const initialQuery = searchParams.get('q') || '';
  const initialLocation = searchParams.get('location') || '';
  const initialType = searchParams.get('type') || '';
  const initialExperience = searchParams.get('experience') || '';
  const initialSalary = searchParams.get('salary') || '';
  const initialRemote = searchParams.get('remote') === 'true';
  const initialTechs = searchParams.get('techs')?.split(',').filter(Boolean) || [];

  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [jobType, setJobType] = useState(initialType);
  const [experience, setExperience] = useState(initialExperience);
  const [salaryRange, setSalaryRange] = useState(initialSalary);
  const [remoteOnly, setRemoteOnly] = useState(initialRemote);
  const [selectedTechs, setSelectedTechs] = useState<string[]>(initialTechs);

  // Extract available filter options from all jobs (real data)
  const availableLocations = useMemo(() => extractUniqueLocations(allJobs), [allJobs]);
  const availableTechs = useMemo(() => extractUniqueTechs(allJobs), [allJobs]);

  // Fetch jobs
  // NOTE: Backend automatically tracks search/filters for logged-in users
  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchJobs({
        query: searchQuery || undefined,
        location: location || undefined,
        type: jobType || undefined,
        experience: experience || undefined,
      });
      setAllJobs(data);
      applyClientFilters(data);
    } catch (err) {
      setError('Không thể tải danh sách công việc. Vui lòng thử lại.');
      console.error('Failed to fetch jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, location, jobType, experience]);

  // Apply client-side filters
  const applyClientFilters = useCallback(
    (jobsList: Job[]) => {
      let filtered = [...jobsList];

      // Filter by location (from sidebar)
      if (location) {
        filtered = filtered.filter((job) => 
          job.location?.toLowerCase().includes(location.toLowerCase())
        );
      }

      // Filter by tech stack
      if (selectedTechs.length > 0) {
        filtered = filtered.filter((job) => {
          if (!job.jobTech || !Array.isArray(job.jobTech)) return false;
          const jobTechLower = job.jobTech.map(t => t.toLowerCase());
          return selectedTechs.some(tech => 
            jobTechLower.some(jt => jt.includes(tech.toLowerCase()))
          );
        });
      }

      // Filter by salary range
      if (salaryRange) {
        if (salaryRange === '5000+') {
          filtered = filtered.filter((job) => job.salary && job.salary.min >= 5000);
        } else {
          const [min, max] = salaryRange.split('-').map(Number);
          filtered = filtered.filter((job) => {
            if (!job.salary) return false;
            return job.salary.min >= min && job.salary.max <= max;
          });
        }
      }

      // Filter by remote
      if (remoteOnly) {
        filtered = filtered.filter((job) => job.remote);
      }

      setJobs(filtered);
    },
    [location, selectedTechs, salaryRange, remoteOnly]
  );

  // Initial load
  useEffect(() => {
    loadJobs();
  }, []);

  // Re-apply filters when they change
  useEffect(() => {
    applyClientFilters(allJobs);
  }, [location, selectedTechs, salaryRange, remoteOnly, allJobs, applyClientFilters]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURLParams();
    loadJobs();
  };

  // Update URL params
  const updateURLParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location) params.set('location', location);
    if (jobType) params.set('type', jobType);
    if (experience) params.set('experience', experience);
    if (salaryRange) params.set('salary', salaryRange);
    if (remoteOnly) params.set('remote', 'true');
    if (selectedTechs.length > 0) params.set('techs', selectedTechs.join(','));

    router.push(`/jobs?${params.toString()}`, { scroll: false });
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setLocation('');
    setJobType('');
    setExperience('');
    setSalaryRange('');
    setRemoteOnly(false);
    setSelectedTechs([]);
    router.push('/jobs');
    fetchJobs().then((data) => {
      setAllJobs(data);
      setJobs(data);
    });
  };

  // Apply filters and close mobile drawer
  const handleApplyFilters = () => {
    updateURLParams();
    loadJobs();
    setShowMobileFilters(false);
  };

  // Count active filters
  const activeFiltersCount = [
    jobType, 
    experience, 
    salaryRange, 
    remoteOnly, 
    location,
    selectedTechs.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search */}
      <JobSearchHeader
        searchQuery={searchQuery}
        location={location}
        onSearchQueryChange={setSearchQuery}
        onLocationChange={setLocation}
        onSearch={handleSearch}
      />

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters (Desktop) */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <JobFilterSidebar
              jobType={jobType}
              experience={experience}
              salaryRange={salaryRange}
              remoteOnly={remoteOnly}
              selectedLocation={location}
              selectedTechs={selectedTechs}
              availableLocations={availableLocations}
              availableTechs={availableTechs}
              onJobTypeChange={setJobType}
              onExperienceChange={setExperience}
              onSalaryRangeChange={setSalaryRange}
              onRemoteOnlyChange={setRemoteOnly}
              onLocationChange={setLocation}
              onTechsChange={setSelectedTechs}
              onApply={handleApplyFilters}
              onReset={resetFilters}
              activeFiltersCount={activeFiltersCount}
            />
          </div>

          {/* Right Content - Job Listings */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowMobileFilters(true)}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeFiltersCount > 0
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'bg-white border border-gray-200 text-gray-700'
                }`}
              >
                <SlidersHorizontal className="h-5 w-5" />
                Bộ lọc
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isLoading ? 'Đang tìm kiếm...' : `${jobs.length} việc làm`}
                </h2>
                {(searchQuery || location) && !isLoading && (
                  <p className="text-sm text-gray-600 mt-1">
                    {searchQuery && <span>"{searchQuery}"</span>}
                    {searchQuery && location && <span> tại </span>}
                    {location && <span>"{location}"</span>}
                  </p>
                )}
              </div>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option>Mới nhất</option>
                <option>Lương cao nhất</option>
                <option>Phù hợp nhất</option>
              </select>
            </div>

            {/* Active Filters Tags */}
            <JobFilterTags
              jobType={jobType}
              experience={experience}
              salaryRange={salaryRange}
              remoteOnly={remoteOnly}
              selectedLocation={location}
              selectedTechs={selectedTechs}
              onJobTypeRemove={() => setJobType('')}
              onExperienceRemove={() => setExperience('')}
              onSalaryRangeRemove={() => setSalaryRange('')}
              onRemoteOnlyRemove={() => setRemoteOnly(false)}
              onLocationRemove={() => setLocation('')}
              onTechRemove={(tech) => setSelectedTechs(selectedTechs.filter(t => t !== tech))}
            />

            {/* Job Listings */}
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner size="md" text="Đang tải..." />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                  <X className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Lỗi kết nối</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <button
                  onClick={loadJobs}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Thử lại
                </button>
              </div>
            ) : jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Search}
                title="Không tìm thấy kết quả"
                description="Thử thay đổi từ khóa hoặc bộ lọc"
                actionLabel="Xóa bộ lọc"
                onAction={resetFilters}
              />
            )}

            {/* Pagination */}
            {jobs.length > 0 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-1">
                  <button
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    disabled
                  >
                    ‹
                  </button>
                  <button className="px-3 py-2 bg-blue-600 text-white rounded-lg">
                    1
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    2
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    3
                  </button>
                  <span className="px-2 text-gray-400">...</span>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    10
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
      >
        <JobFilterSidebar
          jobType={jobType}
          experience={experience}
          salaryRange={salaryRange}
          remoteOnly={remoteOnly}
          selectedLocation={location}
          selectedTechs={selectedTechs}
          availableLocations={availableLocations}
          availableTechs={availableTechs}
          onJobTypeChange={setJobType}
          onExperienceChange={setExperience}
          onSalaryRangeChange={setSalaryRange}
          onRemoteOnlyChange={setRemoteOnly}
          onLocationChange={setLocation}
          onTechsChange={setSelectedTechs}
          onApply={handleApplyFilters}
          onReset={resetFilters}
          activeFiltersCount={activeFiltersCount}
        />
      </MobileFilterDrawer>
    </div>
  );
}

// Loading fallback for Suspense
function JobsListLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner size="md" text="Đang tải..." />
    </div>
  );
}

// Main export with Suspense boundary
export default function JobsListPage() {
  return (
    <Suspense fallback={<JobsListLoading />}>
      <JobsListContent />
    </Suspense>
  );
}
