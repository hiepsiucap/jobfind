'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, notFound } from 'next/navigation';
import { 
  fetchBackendJobById, 
  BackendJob, 
  trackJobViewTime,
  saveJob,
  unsaveJob,
  getSavedJobs,
  applyForJob,
  fetchResumes,
  Resume,
} from '@/lib/api';
import { MatchScoreBadge } from '@/components/jobs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  Award,
  Globe,
  Code,
  Bookmark,
  BookmarkCheck,
  Loader2,
  FileText,
  CheckCircle,
  X,
} from 'lucide-react';

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatSalary(min: number, max: number, currency: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  });
  return `${formatter.format(min)} - ${formatter.format(max)}`;
}

function formatJobType(jobType: string): string {
  const mapping: Record<string, string> = {
    'FULL_TIME': 'Full Time',
    'PART_TIME': 'Part Time',
    'CONTRACT': 'Contract',
    'INTERNSHIP': 'Internship',
  };
  return mapping[jobType] || jobType;
}

function formatLevel(level: string): string {
  const mapping: Record<string, string> = {
    'ENTRY': 'Entry Level',
    'JUNIOR': 'Junior',
    'MID': 'Mid Level',
    'SENIOR': 'Senior',
    'LEAD': 'Lead',
  };
  return mapping[level] || level;
}

// Threshold time to trigger tracking event (2 minutes = 120 seconds)
const TRACKING_THRESHOLD_SECONDS = 120;

export default function JobDetailPage() {
  const params = useParams();
  const { isAuthenticated, accessToken } = useAuth();
  const [job, setJob] = useState<BackendJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Saved job state
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Apply state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  
  // Time tracking refs
  const viewStartTimeRef = useRef<number | null>(null);
  const hasTrackedRef = useRef(false);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Send tracking event
  const sendTrackingEvent = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !params.id || hasTrackedRef.current) {
      return;
    }
    
    if (!viewStartTimeRef.current) return;
    
    const timeOnSight = Math.floor((Date.now() - viewStartTimeRef.current) / 1000);
    
    // Only track if viewed for at least the threshold time
    if (timeOnSight >= TRACKING_THRESHOLD_SECONDS) {
      console.log(`📊 [Tracking] User viewed job ${params.id} for ${timeOnSight} seconds - sending tracking event`);
      hasTrackedRef.current = true;
      await trackJobViewTime(params.id as string, timeOnSight, accessToken);
    }
  }, [isAuthenticated, accessToken, params.id]);

  // Job view time tracking effect
  useEffect(() => {
    if (!job || !isAuthenticated || !accessToken) return;
    
    // Reset tracking state for new job
    hasTrackedRef.current = false;
    viewStartTimeRef.current = Date.now();
    
    console.log(`⏱️ [Tracking] Started tracking view time for job: ${job.title}`);
    
    // Set up interval to check if threshold reached
    trackingIntervalRef.current = setInterval(() => {
      if (!viewStartTimeRef.current || hasTrackedRef.current) return;
      
      const elapsed = Math.floor((Date.now() - viewStartTimeRef.current) / 1000);
      
      if (elapsed >= TRACKING_THRESHOLD_SECONDS && !hasTrackedRef.current) {
        console.log(`⏱️ [Tracking] Threshold reached (${TRACKING_THRESHOLD_SECONDS}s) - triggering tracking event`);
        sendTrackingEvent();
      }
    }, 10000); // Check every 10 seconds
    
    // Cleanup: send tracking on unmount (page leave)
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      
      // Send final tracking event when leaving page
      if (!hasTrackedRef.current && viewStartTimeRef.current) {
        const timeOnSight = Math.floor((Date.now() - viewStartTimeRef.current) / 1000);
        if (timeOnSight >= TRACKING_THRESHOLD_SECONDS && accessToken) {
          console.log(`📊 [Tracking] Page leave - sending tracking event (${timeOnSight}s)`);
          trackJobViewTime(params.id as string, timeOnSight, accessToken);
        }
      }
    };
  }, [job, isAuthenticated, accessToken, params.id, sendTrackingEvent]);

  // Handle visibility change (tab switch/minimize)
  useEffect(() => {
    if (!job || !isAuthenticated) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden && !hasTrackedRef.current && viewStartTimeRef.current && accessToken) {
        const timeOnSight = Math.floor((Date.now() - viewStartTimeRef.current) / 1000);
        if (timeOnSight >= TRACKING_THRESHOLD_SECONDS) {
          console.log(`📊 [Tracking] Tab hidden - sending tracking event (${timeOnSight}s)`);
          hasTrackedRef.current = true;
          trackJobViewTime(params.id as string, timeOnSight, accessToken);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [job, isAuthenticated, accessToken, params.id]);

  // Check if job is saved
  useEffect(() => {
    async function checkSavedStatus() {
      if (!isAuthenticated || !accessToken || !params.id) return;
      
      try {
        const savedJobsData = await getSavedJobs(accessToken, 1, 100);
        const savedIds = savedJobsData.jobs?.map(j => j.id) || [];
        setIsSaved(savedIds.includes(params.id as string));
      } catch (err) {
        console.error('Failed to check saved status:', err);
      }
    }
    
    checkSavedStatus();
  }, [isAuthenticated, accessToken, params.id]);

  // Load user's resumes for apply modal
  useEffect(() => {
    async function loadResumes() {
      if (!isAuthenticated || !accessToken) return;
      
      try {
        const data = await fetchResumes(accessToken);
        setResumes(data.resumes || []);
        if (data.resumes?.length > 0) {
          setSelectedResumeId(data.resumes[0].id);
        }
      } catch (err) {
        console.error('Failed to load resumes:', err);
      }
    }
    
    loadResumes();
  }, [isAuthenticated, accessToken]);

  // Handle save/unsave job
  const handleToggleSave = async () => {
    if (!isAuthenticated || !accessToken || !params.id) {
      toast.error('Vui lòng đăng nhập để lưu công việc');
      return;
    }
    
    setIsSaving(true);
    try {
      if (isSaved) {
        await unsaveJob(params.id as string, accessToken);
        setIsSaved(false);
      } else {
        await saveJob(params.id as string, accessToken);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle apply
  const handleApply = async () => {
    if (!isAuthenticated || !accessToken) {
      toast.error('Vui lòng đăng nhập để ứng tuyển');
      return;
    }
    
    if (!selectedResumeId) {
      setApplyError('Vui lòng chọn CV để ứng tuyển');
      return;
    }
    
    setIsApplying(true);
    setApplyError(null);
    
    try {
      await applyForJob(params.id as string, selectedResumeId, accessToken);
      setApplySuccess(true);
      setTimeout(() => {
        setShowApplyModal(false);
        setApplySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to apply:', err);
      setApplyError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsApplying(false);
    }
  };

  useEffect(() => {
    async function loadJob() {
      if (!params.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchBackendJobById(params.id as string);
        if (!data) {
          setError('Không tìm thấy công việc');
        } else {
          setJob(data);
        }
      } catch (err) {
        setError('Không thể tải thông tin công việc');
        console.error('Failed to fetch job:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadJob();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 text-lg">Đang tải...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Không tìm thấy công việc'}</h2>
            <a href="/" className="text-blue-600 hover:underline">Quay về trang chủ</a>
          </div>
        </div>
      </div>
    );
  }

  const isRemote = job.location?.toLowerCase().includes('remote');

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex gap-5 flex-1 min-w-0">
              {/* Company Logo */}
              {job.company?.logoUrl ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md bg-white border border-gray-100 flex-shrink-0">
                  <img 
                    src={job.company.logoUrl} 
                    alt={`${job.company.name} logo`}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"><svg class="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div>';
                    }}
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
              )}
              
              {/* Job Info */}
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {job.title}
                </h1>
                <div className="flex items-center space-x-2 text-lg text-gray-700 mb-2">
                  <span className="font-semibold">{job.company?.name || 'Unknown Company'}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{formatJobType(job.jobType)}</span>
                  </div>
                  {isRemote && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>Remote</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-3">
              {/* Match Score */}
              <MatchScoreBadge
                job={{
                  jobTech: job.jobTech || [],
                  level: job.level || 'MID',
                  title: job.title,
                  description: job.description,
                  requirements: job.requirements,
                }}
                size="md"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleToggleSave}
                  disabled={isSaving}
                  className={`px-4 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                    isSaved 
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isSaved ? (
                    <BookmarkCheck className="h-5 w-5" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </button>
                <button 
                  onClick={() => setShowApplyModal(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Ứng tuyển ngay
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            {job.salaryMin && job.salaryMax && (
              <div className="flex items-start space-x-3">
                <DollarSign className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <div className="text-sm text-gray-600">Mức lương</div>
                  <div className="font-semibold text-gray-900">
                    {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <div className="text-sm text-gray-600">Ngày đăng</div>
                <div className="font-semibold text-gray-900">
                  {formatDate(job.postedAt || job.createdAt)}
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <div className="text-sm text-gray-600">Cấp bậc</div>
                <div className="font-semibold text-gray-900">
                  {formatLevel(job.level)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Mô tả công việc
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</div>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Trách nhiệm
                </h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">{job.responsibilities}</div>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Yêu cầu
                </h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">{job.requirements}</div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Phúc lợi
                </h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">{job.benefits}</div>
              </div>
            )}

            {/* Tech Stack */}
            {job.jobTech && job.jobTech.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Công nghệ sử dụng
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.jobTech.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Apply */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Ứng tuyển nhanh</h3>
              <button 
                onClick={() => setShowApplyModal(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-3 flex items-center justify-center gap-2"
              >
                <FileText className="h-5 w-5" />
                Ứng tuyển với CV
              </button>
              <button 
                onClick={handleToggleSave}
                disabled={isSaving}
                className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                  isSaved 
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300' 
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isSaved ? (
                  <>
                    <BookmarkCheck className="h-5 w-5" />
                    Đã lưu
                  </>
                ) : (
                  <>
                    <Bookmark className="h-5 w-5" />
                    Lưu công việc
                  </>
                )}
              </button>
            </div>

            {/* Job Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Tổng quan</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Ngành nghề</div>
                  <div className="font-medium text-gray-900">{job.company?.industry || 'Technology'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Kinh nghiệm</div>
                  <div className="font-medium text-gray-900">
                    {job.experienceRequirement || formatLevel(job.level)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Loại hình</div>
                  <div className="font-medium text-gray-900">
                    {formatJobType(job.jobType)}
                  </div>
                </div>
              </div>
            </div>

            {/* Company Info */}
            {job.company && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Về {job.company.name}
                </h3>
                {job.company.logoUrl && (
                  <img 
                    src={job.company.logoUrl} 
                    alt={job.company.name}
                    className="w-16 h-16 object-contain mb-4 rounded-lg"
                  />
                )}
                <p className="text-gray-600 text-sm mb-4">
                  {job.company.description || `${job.company.name} là công ty hàng đầu trong ngành ${job.company.industry}.`}
                </p>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {job.company.companySize && (
                    <div>Quy mô: {job.company.companySize} nhân viên</div>
                  )}
                  {job.company.location && (
                    <div>Địa điểm: {job.company.location}</div>
                  )}
                  {job.company.foundedYear && (
                    <div>Năm thành lập: {job.company.foundedYear}</div>
                  )}
                </div>
                {job.company.website && (
                  <a 
                    href={job.company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block text-center border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Xem trang công ty
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Ứng tuyển công việc</h3>
              <button 
                onClick={() => {
                  setShowApplyModal(false);
                  setApplyError(null);
                  setApplySuccess(false);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {applySuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Ứng tuyển thành công!</h4>
                  <p className="text-gray-600">
                    Đơn ứng tuyển của bạn đã được gửi đến nhà tuyển dụng.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <p className="text-gray-700 mb-2">
                      Bạn đang ứng tuyển vị trí <span className="font-semibold">{job.title}</span> tại <span className="font-semibold">{job.company?.name}</span>
                    </p>
                  </div>

                  {/* Resume Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn CV để ứng tuyển
                    </label>
                    {resumes.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {resumes.map((resume) => (
                          <label 
                            key={resume.id}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedResumeId === resume.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="resume"
                              value={resume.id}
                              checked={selectedResumeId === resume.id}
                              onChange={(e) => setSelectedResumeId(e.target.value)}
                              className="sr-only"
                            />
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                              <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {resume.resumeDetail?.name || 'CV không có tên'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {resume.resumeDetail?.skills?.slice(0, 3).join(', ')}
                                {resume.resumeDetail?.skills?.length > 3 && '...'}
                              </p>
                            </div>
                            {selectedResumeId === resume.id && (
                              <CheckCircle2 className="h-5 w-5 text-blue-600" />
                            )}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-600 mb-3">Bạn chưa có CV nào</p>
                        <a 
                          href="/cv" 
                          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                          Tạo CV ngay
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {applyError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {applyError}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowApplyModal(false)}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleApply}
                      disabled={isApplying || resumes.length === 0}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isApplying ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        'Ứng tuyển'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
