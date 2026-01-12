'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Save, 
  FileText, 
  Bookmark, 
  Briefcase,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Edit2,
  Building2,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { 
  getUserApplications, 
  getSavedJobs, 
  withdrawApplication,
  unsaveJob,
  JobApplicationInfo,
  BackendJob,
  API_BASE_URL,
} from '@/lib/api';
import { toast } from 'sonner';

type ProfileTab = 'info' | 'applications' | 'saved';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
  
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phoneNumber: '' });
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [applications, setApplications] = useState<JobApplicationInfo[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [applicationToWithdraw, setApplicationToWithdraw] = useState<JobApplicationInfo | null>(null);
  
  const [savedJobs, setSavedJobs] = useState<BackendJob[]>([]);
  const [isLoadingSavedJobs, setIsLoadingSavedJobs] = useState(false);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({ fullName: user.fullName || '', phoneNumber: user.phoneNumber || '' });
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (activeTab === 'applications' && accessToken && applications.length === 0) {
      loadApplications();
    }
  }, [activeTab, accessToken]);

  useEffect(() => {
    if (activeTab === 'saved' && accessToken && savedJobs.length === 0) {
      loadSavedJobs();
    }
  }, [activeTab, accessToken]);

  const loadApplications = async () => {
    if (!accessToken) return;
    setIsLoadingApplications(true);
    try {
      const data = await getUserApplications(accessToken, 1, 50);
      setApplications(data.applications || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const loadSavedJobs = async () => {
    if (!accessToken) return;
    setIsLoadingSavedJobs(true);
    try {
      const data = await getSavedJobs(accessToken, 1, 50);
      setSavedJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to load saved jobs:', err);
    } finally {
      setIsLoadingSavedJobs(false);
    }
  };

  const handleWithdrawApplication = (app: JobApplicationInfo) => {
    setApplicationToWithdraw(app);
    setWithdrawModalOpen(true);
  };

  const confirmWithdrawApplication = async () => {
    if (!accessToken || !applicationToWithdraw) return;
    
    setWithdrawingId(applicationToWithdraw.id);
    try {
      await withdrawApplication(applicationToWithdraw.id, accessToken);
      setApplications(prev => prev.filter(app => app.id !== applicationToWithdraw.id));
      toast.success('Đã rút đơn ứng tuyển');
      setWithdrawModalOpen(false);
      setApplicationToWithdraw(null);
    } catch (err) {
      console.error('Failed to withdraw:', err);
      toast.error('Có lỗi xảy ra');
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleUnsaveJob = async (jobId: string) => {
    if (!accessToken) return;
    setUnsavingId(jobId);
    try {
      await unsaveJob(jobId, accessToken);
      setSavedJobs(prev => prev.filter(job => job.id !== jobId));
      toast.success('Đã bỏ lưu công việc');
    } catch (err) {
      console.error('Failed to unsave:', err);
      toast.error('Có lỗi xảy ra');
    } finally {
      setUnsavingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      'APPLIED': { label: 'Đã gửi', className: 'bg-blue-100 text-blue-700', icon: <Clock className="h-3 w-3" /> },
      'REVIEWING': { label: 'Đang xem', className: 'bg-yellow-100 text-yellow-700', icon: <FileText className="h-3 w-3" /> },
      'ACCEPTED': { label: 'Đã nhận', className: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
      'REJECTED': { label: 'Từ chối', className: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
    };
    const c = config[status] || config['APPLIED'];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
        {c.icon}{c.label}
      </span>
    );
  };

  const handleSaveProfile = async () => {
    if (!accessToken) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Không thể cập nhật');
      toast.success('Cập nhật thành công!');
      setIsEditing(false);
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!accessToken) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    setIsChangingPassword(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Không thể đổi mật khẩu');
      }
      toast.success('Đổi mật khẩu thành công!');
      setShowPasswordForm(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatSalary = (min?: number, max?: number, currency?: string) => {
    if (!min && !max) return 'Thỏa thuận';
    const fmt = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(0)}M` : n.toLocaleString();
    if (min && max) return `${fmt(min)} - ${fmt(max)} ${currency || ''}`;
    if (min) return `Từ ${fmt(min)} ${currency || ''}`;
    return `Đến ${fmt(max!)} ${currency || ''}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const tabs = [
    { id: 'info' as const, label: 'Thông tin', icon: User, count: 0 },
    { id: 'applications' as const, label: 'Đã ứng tuyển', icon: Briefcase, count: applications.length },
    { id: 'saved' as const, label: 'Đã lưu', icon: Bookmark, count: savedJobs.length },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header + Tabs in one line */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{user.fullName}</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          
          {/* Horizontal Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Info */}
                <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      Thông tin cá nhân
                    </h3>
                    {!isEditing && (
                      <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                        <Edit2 className="h-3.5 w-3.5" /> Sửa
                      </button>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Họ tên</label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
                        <input
                          type="text"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => setIsEditing(false)} className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button>
                        <button onClick={handleSaveProfile} disabled={isSaving} className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1">
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Lưu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{user.fullName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{user.phoneNumber || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="bg-purple-50/50 rounded-lg p-4 border border-purple-100">
                  <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-3">
                    <Lock className="h-4 w-4 text-purple-600" />
                    Bảo mật
                  </h3>
                  
                  {showPasswordForm ? (
                    <div className="space-y-3">
                      <input
                        type="password"
                        placeholder="Mật khẩu hiện tại"
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none"
                      />
                      <input
                        type="password"
                        placeholder="Mật khẩu mới"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none"
                      />
                      <input
                        type="password"
                        placeholder="Xác nhận mật khẩu mới"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setShowPasswordForm(false)} className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button>
                        <button onClick={handleChangePassword} disabled={isChangingPassword} className="flex-1 px-3 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1">
                          {isChangingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                          Đổi mật khẩu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowPasswordForm(true)} className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                      Đổi mật khẩu →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="p-4">
              {isLoadingApplications ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 text-blue-600 animate-spin" /></div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm mb-3">Bạn chưa ứng tuyển công việc nào</p>
                  <Link href="/jobs" className="text-sm text-blue-600 hover:underline">Tìm việc làm →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50/50 rounded-lg transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/jobs/${app.jobId}`} className="font-medium text-sm text-gray-900 hover:text-blue-600 truncate">
                            {app.jobInfo?.title || 'Unknown'}
                          </Link>
                          {getStatusBadge(app.status)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{app.jobInfo?.companyName}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(app.appliedAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Link href={`/jobs/${app.jobId}`} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        {app.status === 'APPLIED' && (
                          <button onClick={() => handleWithdrawApplication(app)} disabled={withdrawingId === app.id} className="p-1.5 text-gray-400 hover:text-red-600 rounded disabled:opacity-50" title="Rút đơn ứng tuyển">
                            {withdrawingId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Saved Jobs Tab */}
          {activeTab === 'saved' && (
            <div className="p-4">
              {isLoadingSavedJobs ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 text-blue-600 animate-spin" /></div>
              ) : savedJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Bookmark className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm mb-3">Bạn chưa lưu công việc nào</p>
                  <Link href="/jobs" className="text-sm text-blue-600 hover:underline">Tìm việc làm →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50/50 rounded-lg transition-colors">
                      <div className="flex-1 min-w-0">
                        <Link href={`/jobs/${job.id}`} className="font-medium text-sm text-gray-900 hover:text-blue-600 truncate block mb-1">
                          {job.title}
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{job.company?.name || 'Unknown'}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                          <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Link href={`/jobs/${job.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button onClick={() => handleUnsaveJob(job.id)} disabled={unsavingId === job.id} className="p-1.5 text-gray-400 hover:text-red-600 rounded disabled:opacity-50">
                          {unsavingId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Confirmation Modal */}
      <ConfirmModal
        isOpen={withdrawModalOpen}
        onClose={() => {
          setWithdrawModalOpen(false);
          setApplicationToWithdraw(null);
        }}
        onConfirm={confirmWithdrawApplication}
        title="Rút đơn ứng tuyển"
        message={`Bạn có chắc muốn rút đơn ứng tuyển vị trí "${applicationToWithdraw?.jobInfo?.title || ''}"? Hành động này không thể hoàn tác.`}
        confirmText="Rút đơn"
        cancelText="Hủy"
        isLoading={withdrawingId === applicationToWithdraw?.id}
        variant="warning"
      />
    </div>
  );
}
