'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Users,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Building2,
  MapPin,
  ChevronRight,
  Loader2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  GraduationCap,
  Award,
  FolderGit2,
  Link2,
  MessageSquare,
  Save,
  Edit3,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getMyCreatedJobs,
  getJobApplications,
  updateApplicationStatus,
  getApplicationDetail,
  BackendJob,
  JobApplicationInfo,
} from '@/lib/api';
import { toast } from 'sonner';

type ApplicationStatus = 'APPLIED' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';

interface JobWithApplicationCount extends BackendJob {
  applicationCount?: number;
}

export default function RecruiterDashboard() {
  const router = useRouter();
  const { isAuthenticated, accessToken, isLoading: authLoading } = useAuth();
  
  const [jobs, setJobs] = useState<JobWithApplicationCount[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobWithApplicationCount | null>(null);
  const [applications, setApplications] = useState<JobApplicationInfo[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplicationInfo | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [hrNote, setHrNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (accessToken) {
      loadJobs();
    }
  }, [accessToken]);

  const loadJobs = async () => {
    if (!accessToken) {
      console.log('[Recruiter] No access token');
      return;
    }
    setIsLoadingJobs(true);
    console.log('[Recruiter] Loading my created jobs...');
    try {
      // Use getMyCreatedJobs to get only jobs created by current user
      const data = await getMyCreatedJobs(accessToken, 1, 50, true);
      console.log('[Recruiter] My jobs fetched:', data.jobs?.length || 0);
      
      // Load application count for each job
      const jobsWithCounts = await Promise.all(
        (data.jobs || []).map(async (job) => {
          try {
            const apps = await getJobApplications(job.id, accessToken, 1, 1);
            console.log(`[Recruiter] Job ${job.id}: ${apps.total} apps`);
            return { ...job, applicationCount: apps.total };
          } catch (e) {
            console.log(`[Recruiter] Job ${job.id}: error`, e);
            return { ...job, applicationCount: 0 };
          }
        })
      );
      console.log('[Recruiter] Jobs with counts:', jobsWithCounts.length);
      setJobs(jobsWithCounts);
      if (jobsWithCounts.length > 0) {
        setSelectedJob(jobsWithCounts[0]);
        loadApplications(jobsWithCounts[0].id);
      }
    } catch (err) {
      console.error('[Recruiter] Failed to load jobs:', err);
      toast.error('Không thể tải danh sách công việc');
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const loadApplications = async (jobId: string) => {
    if (!accessToken) return;
    setIsLoadingApplications(true);
    setSelectedApplication(null);
    try {
      const data = await getJobApplications(jobId, accessToken, 1, 100);
      setApplications(data.applications || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const handleSelectJob = (job: JobWithApplicationCount) => {
    setSelectedJob(job);
    loadApplications(job.id);
  };

  const handleSelectApplication = async (app: JobApplicationInfo) => {
    if (!accessToken) return;
    setSelectedApplication(app);
    setIsLoadingDetail(true);
    setIsEditingNote(false);
    try {
      const detail = await getApplicationDetail(app.id, accessToken);
      setSelectedApplication(detail);
      setHrNote((detail as any).hrNote || '');
    } catch (err) {
      console.error('Failed to load detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSaveNote = async () => {
    if (!accessToken || !selectedApplication) return;
    setIsSavingNote(true);
    try {
      await updateApplicationStatus(
        selectedApplication.id, 
        selectedApplication.status as ApplicationStatus, 
        hrNote, 
        accessToken
      );
      setIsEditingNote(false);
      toast.success('Đã lưu ghi chú');
    } catch (err) {
      console.error('Failed to save note:', err);
      toast.error('Không thể lưu ghi chú');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleUpdateStatus = async (appId: string, status: ApplicationStatus) => {
    if (!accessToken) return;
    setUpdatingId(appId);
    try {
      await updateApplicationStatus(appId, status, '', accessToken);
      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === appId ? { ...app, status } : app
      ));
      if (selectedApplication?.id === appId) {
        setSelectedApplication(prev => prev ? { ...prev, status } : null);
      }
      toast.success(`Đã cập nhật trạng thái: ${getStatusLabel(status)}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'APPLIED': 'Đã gửi',
      'REVIEWING': 'Đang xem xét',
      'ACCEPTED': 'Đã chấp nhận',
      'REJECTED': 'Đã từ chối',
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      'APPLIED': { className: 'bg-blue-100 text-blue-700', icon: <Clock className="h-3 w-3" /> },
      'REVIEWING': { className: 'bg-yellow-100 text-yellow-700', icon: <Eye className="h-3 w-3" /> },
      'ACCEPTED': { className: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
      'REJECTED': { className: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
    };
    const c = config[status] || config['APPLIED'];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
        {c.icon}{getStatusLabel(status)}
      </span>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 min-h-[calc(100vh-64px)]">
      <div className="h-[calc(100vh-64px)] flex">
        {/* Left Panel - Jobs List */}
        <div className="w-72 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-gray-900">Tin tuyển dụng</h2>
            </div>
            <Link href="/post-job" className="text-xs text-blue-600 hover:underline">+ Đăng tin mới</Link>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoadingJobs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Chưa có tin tuyển dụng nào
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                      selectedJob?.id === job.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900 truncate">{job.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {job.company?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                        <Users className="h-3 w-3" />
                        {job.applicationCount || 0} ứng viên
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel - Applications List */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Danh sách ứng viên
              {applications.length > 0 && (
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                  {applications.length}
                </span>
              )}
            </h3>
            {selectedJob && (
              <p className="text-xs text-gray-500 mt-1 truncate">{selectedJob.title}</p>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {!selectedJob ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Chọn một tin tuyển dụng
              </div>
            ) : isLoadingApplications ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Chưa có ứng viên nào
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => handleSelectApplication(app)}
                    className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                      selectedApplication?.id === app.id ? 'bg-purple-50 border-l-2 border-l-purple-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900">{app.applicantName}</span>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {app.university || 'N/A'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(app.appliedAt).toLocaleDateString('vi-VN')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Application Detail */}
        <div className="flex-1 bg-gray-50 flex flex-col">
          {!selectedApplication ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">Chọn ứng viên để xem chi tiết</p>
              </div>
            </div>
          ) : isLoadingDetail ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              {/* Header */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedApplication.applicantName}</h2>
                    <p className="text-sm text-gray-500">{selectedApplication.university}</p>
                  </div>
                  {getStatusBadge(selectedApplication.status)}
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleUpdateStatus(selectedApplication.id, 'REVIEWING')}
                    disabled={updatingId === selectedApplication.id || selectedApplication.status === 'REVIEWING'}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Đang xem
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedApplication.id, 'ACCEPTED')}
                    disabled={updatingId === selectedApplication.id || selectedApplication.status === 'ACCEPTED'}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    <UserCheck className="h-4 w-4" />
                    Chấp nhận
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedApplication.id, 'REJECTED')}
                    disabled={updatingId === selectedApplication.id || selectedApplication.status === 'REJECTED'}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    <UserX className="h-4 w-4" />
                    Từ chối
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              {(selectedApplication as any).resumeDetail && (
                <>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      Thông tin liên hệ
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{(selectedApplication as any).resumeDetail.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{(selectedApplication as any).resumeDetail.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {(selectedApplication as any).resumeDetail.summary && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-2">Giới thiệu</h3>
                      <p className="text-sm text-gray-600">{(selectedApplication as any).resumeDetail.summary}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {(selectedApplication as any).resumeDetail.skills?.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-2">Kỹ năng</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedApplication as any).resumeDetail.skills.map((skill: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {(selectedApplication as any).resumeDetail.experience?.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-green-600" />
                        Kinh nghiệm làm việc
                      </h3>
                      <div className="space-y-3">
                        {(selectedApplication as any).resumeDetail.experience.map((exp: any, i: number) => (
                          <div key={i} className="border-l-2 border-green-200 pl-3">
                            <div className="font-medium text-sm">{exp.title}</div>
                            <div className="text-xs text-gray-600">{exp.company} • {exp.duration}</div>
                            {exp.responsibilities?.length > 0 && (
                              <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
                                {exp.responsibilities.slice(0, 3).map((r: string, j: number) => (
                                  <li key={j}>{r}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {(selectedApplication as any).resumeDetail.education?.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-purple-600" />
                        Học vấn
                      </h3>
                      <div className="space-y-2">
                        {(selectedApplication as any).resumeDetail.education.map((edu: any, i: number) => (
                          <div key={i} className="text-sm">
                            <div className="font-medium">{edu.degree}</div>
                            <div className="text-xs text-gray-600">{edu.institution} • {edu.graduationYear}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {(selectedApplication as any).resumeDetail.certifications?.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4 text-orange-600" />
                        Chứng chỉ
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedApplication as any).resumeDetail.certifications.map((cert: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {(selectedApplication as any).resumeDetail.projects?.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <FolderGit2 className="h-4 w-4 text-cyan-600" />
                        Dự án
                      </h3>
                      <div className="space-y-3">
                        {(selectedApplication as any).resumeDetail.projects.map((project: any, i: number) => (
                          <div key={i} className="border-l-2 border-cyan-200 pl-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{project.name}</span>
                              {project.url && (
                                <a 
                                  href={project.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Link2 className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            {project.role && (
                              <div className="text-xs text-gray-600">{project.role} {project.duration && `• ${project.duration}`}</div>
                            )}
                            {project.technologies?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {project.technologies.map((tech: string, j: number) => (
                                  <span key={j} className="px-1.5 py-0.5 bg-cyan-50 text-cyan-700 rounded text-[10px]">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                            {project.description && (
                              <p className="text-xs text-gray-500 mt-1">{project.description}</p>
                            )}
                            {project.achievements?.length > 0 && (
                              <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
                                {project.achievements.slice(0, 3).map((a: string, j: number) => (
                                  <li key={j}>{a}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* HR Notes - Always visible if application is selected */}
              {selectedApplication && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-indigo-600" />
                      Ghi chú (HR)
                    </h3>
                    {!isEditingNote ? (
                      <button
                        onClick={() => setIsEditingNote(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        Chỉnh sửa
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveNote}
                        disabled={isSavingNote}
                        className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 disabled:opacity-50"
                      >
                        {isSavingNote ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        Lưu
                      </button>
                    )}
                  </div>
                  {isEditingNote ? (
                    <textarea
                      value={hrNote}
                      onChange={(e) => setHrNote(e.target.value)}
                      placeholder="Nhập ghi chú về ứng viên này..."
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={4}
                    />
                  ) : (
                    <div className="text-sm text-gray-600">
                      {hrNote ? (
                        <p className="whitespace-pre-wrap">{hrNote}</p>
                      ) : (
                        <p className="text-gray-400 italic">Chưa có ghi chú. Nhấn "Chỉnh sửa" để thêm.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

