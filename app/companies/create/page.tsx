'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Globe, MapPin, Calendar, FileText, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';

export default function CreateCompanyPage() {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    logoUrl: '',
    industry: '',
    companySize: '',
    location: '',
    foundedYear: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !accessToken) {
      toast.error('Vui lòng đăng nhập để tạo công ty');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể tạo công ty');
      }

      const data = await response.json();
      toast.success('Tạo công ty thành công!');
      router.push(`/companies/${data.id}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể tạo công ty';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Đăng nhập để tiếp tục</h2>
          <p className="text-sm text-gray-500 mb-4">Bạn cần đăng nhập để tạo công ty mới</p>
          <Link
            href="/login"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-4">
          <Link
            href="/companies"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Tạo công ty mới</h1>
              <p className="text-sm text-gray-500">Thêm công ty vào JobFind</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="bg-purple-50/50 rounded-lg p-3 border border-purple-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
                  Thông tin cơ bản
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tên công ty *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="VD: Tech Innovations Inc."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-100 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ngành nghề</label>
                      <input
                        type="text"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        placeholder="VD: Technology"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Quy mô</label>
                      <select
                        name="companySize"
                        value={formData.companySize}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-100 outline-none bg-white"
                      >
                        <option value="">Chọn</option>
                        <option value="1-10">1-10</option>
                        <option value="11-50">11-50</option>
                        <option value="51-200">51-200</option>
                        <option value="201-500">201-500</option>
                        <option value="501-1000">501-1000</option>
                        <option value="1001+">1001+</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Địa điểm</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="VD: Hồ Chí Minh"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Năm thành lập</label>
                      <input
                        type="text"
                        name="foundedYear"
                        value={formData.foundedYear}
                        onChange={handleChange}
                        placeholder="VD: 2015"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-100 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Online Info */}
              <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
                  Thông tin online
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://company.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Logo URL</label>
                    <input
                      type="url"
                      name="logoUrl"
                      value={formData.logoUrl}
                      onChange={handleChange}
                      placeholder="https://company.com/logo.png"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="bg-green-50/50 rounded-lg p-3 border border-green-100 h-full">
                <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">3</span>
                  Giới thiệu công ty
                </h3>
                
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={10}
                  placeholder="Mô tả về công ty, văn hóa, sứ mệnh, tầm nhìn..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-100 outline-none resize-none h-[calc(100%-40px)]"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
            <Link
              href="/companies"
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <span>Tạo công ty</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
