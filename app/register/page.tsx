'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Briefcase, User, Phone, Building2, UserCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCompanies, Company } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: 'USER',
    companyId: '',
  });

  useEffect(() => {
    if (formData.role === 'HR' && companies.length === 0) {
      loadCompanies();
    }
  }, [formData.role]);

  const loadCompanies = async () => {
    setIsLoadingCompanies(true);
    try {
      const data = await fetchCompanies({ pageSize: 100 });
      setCompanies(data.companies || []);
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (formData.role === 'HR' && !formData.companyId) {
      setError('Vui lòng chọn công ty');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber || undefined,
        role: formData.role,
        companyId: formData.role === 'HR' ? formData.companyId : undefined,
      });
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <Link href="/" className="inline-flex items-center space-x-3 mb-10">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Briefcase className="h-10 w-10 text-white" />
            </div>
            <span className="text-4xl font-display font-bold text-white">
              JobFind
            </span>
          </Link>
          
          <h1 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight mb-6">
            Bắt đầu hành trình<br />
            <span className="text-purple-200">sự nghiệp của bạn</span>
          </h1>
          
          <p className="text-lg text-purple-100 mb-8 max-w-md">
            Tạo tài khoản miễn phí và khám phá hàng ngàn cơ hội việc làm từ các công ty hàng đầu.
          </p>
          
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-white/90">
              <CheckCircle2 className="h-5 w-5 text-green-300" />
              <span>Miễn phí hoàn toàn cho ứng viên</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <CheckCircle2 className="h-5 w-5 text-green-300" />
              <span>Tạo CV chuyên nghiệp với AI</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <CheckCircle2 className="h-5 w-5 text-green-300" />
              <span>Nhận thông báo việc làm phù hợp</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <CheckCircle2 className="h-5 w-5 text-green-300" />
              <span>Theo dõi trạng thái ứng tuyển</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-lg py-4">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <Link href="/" className="inline-flex items-center space-x-2">
              <Briefcase className="h-10 w-10 text-purple-600" />
              <span className="text-2xl font-display font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                JobFind
              </span>
            </Link>
          </div>

          <div className="text-center lg:text-left mb-6">
            <h2 className="text-2xl xl:text-3xl font-display font-bold text-gray-900">
              Tạo tài khoản mới
            </h2>
            <p className="mt-1 text-gray-600 text-sm">
              Điền thông tin để bắt đầu tìm việc
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-lg p-5 xl:p-6 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* 2 columns for name and email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Họ và tên *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="0123456789"
                    className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Role Selection - Compact */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Bạn là *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'USER', companyId: '' })}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-sm ${
                      formData.role === 'USER'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <UserCircle className="h-4 w-4" />
                    <span className="font-medium">Người tìm việc</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'HR' })}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-sm ${
                      formData.role === 'HR'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">Nhà tuyển dụng</span>
                  </button>
                </div>
              </div>

              {/* Company Selection for HR */}
              {formData.role === 'HR' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Công ty *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={formData.companyId}
                      onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                      required={formData.role === 'HR'}
                      disabled={isLoadingCompanies}
                      className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all bg-white appearance-none disabled:bg-gray-100 text-sm"
                    >
                      <option value="">{isLoadingCompanies ? 'Đang tải...' : '-- Chọn công ty --'}</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Chưa có công ty? <Link href="/companies/create" className="text-indigo-600 hover:underline">Tạo mới</Link>
                  </p>
                </div>
              )}

              {/* 2 columns for passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Mật khẩu *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Ít nhất 6 ký tự"
                      className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Xác nhận *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-0.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-xs text-gray-600">
                  Tôi đồng ý với{' '}
                  <Link href="/terms" className="text-purple-600 hover:underline">
                    Điều khoản
                  </Link>{' '}
                  và{' '}
                  <Link href="/privacy" className="text-purple-600 hover:underline">
                    Chính sách bảo mật
                  </Link>
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tạo tài khoản...
                  </span>
                ) : (
                  'Đăng ký'
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-gray-600 text-sm">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
