'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, MapPin, Users, Globe, Calendar, Briefcase, ArrowLeft } from 'lucide-react';
import { fetchCompanyById, fetchJobs, Company } from '@/lib/api';
import { Job } from '@/types';
import JobCard from '@/components/JobCard';

export default function CompanyDetailPage() {
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!params.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const [companyData, jobsData] = await Promise.all([
          fetchCompanyById(params.id as string),
          fetchJobs({ query: params.id as string }), // Try to filter by company
        ]);

        if (!companyData) {
          setError('Không tìm thấy công ty');
        } else {
          setCompany(companyData);
          setJobs(jobsData);
        }
      } catch (err) {
        setError('Không thể tải thông tin công ty');
        console.error('Failed to fetch company:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex justify-center items-center py-24">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center py-24">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Không tìm thấy công ty'}</h2>
          <Link href="/companies" className="text-purple-600 hover:underline">
            Quay về danh sách công ty
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/companies"
            className="inline-flex items-center gap-2 text-purple-200 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>

          <div className="flex flex-col md:flex-row items-start gap-6">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-24 h-24 rounded-2xl object-cover bg-white"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center text-4xl font-bold">
                {company.name.charAt(0)}
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                {company.name}
              </h1>
              {company.industry && (
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mb-4">
                  {company.industry}
                </span>
              )}
              <div className="flex flex-wrap gap-4 text-purple-100">
                {company.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{company.location}</span>
                  </div>
                )}
                {company.companySize && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{company.companySize} nhân viên</span>
                  </div>
                )}
                {company.foundedYear && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Thành lập {company.foundedYear}</span>
                  </div>
                )}
              </div>
            </div>

            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
              >
                <Globe className="h-5 w-5" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Giới thiệu công ty</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {company.description || 'Chưa có thông tin giới thiệu.'}
              </p>
            </div>

            {/* Jobs */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Vị trí đang tuyển
              </h2>
              {jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có vị trí nào đang tuyển</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Thông tin công ty</h3>
              <div className="space-y-4">
                {company.industry && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Ngành nghề</div>
                    <div className="font-medium text-gray-900">{company.industry}</div>
                  </div>
                )}
                {company.companySize && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Quy mô</div>
                    <div className="font-medium text-gray-900">{company.companySize} nhân viên</div>
                  </div>
                )}
                {company.location && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Địa điểm</div>
                    <div className="font-medium text-gray-900">{company.location}</div>
                  </div>
                )}
                {company.foundedYear && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Năm thành lập</div>
                    <div className="font-medium text-gray-900">{company.foundedYear}</div>
                  </div>
                )}
                {company.website && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Website</div>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-purple-600 hover:text-purple-700"
                    >
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}










