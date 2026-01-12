'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, MapPin, Users, Globe, Search, Plus } from 'lucide-react';
import { fetchCompanies, Company } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function CompaniesPage() {
  const { isAuthenticated } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCompanies({ pageSize: 50 });
      setCompanies(data.companies || []);
    } catch (err) {
      setError('Không thể tải danh sách công ty');
      console.error('Failed to fetch companies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCompanies({
        keyword: searchQuery || undefined,
        industry: industryFilter || undefined,
        pageSize: 50,
      });
      setCompanies(data.companies || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = !searchQuery || 
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = !industryFilter || company.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Khám phá các công ty hàng đầu
            </h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Tìm hiểu về các công ty và cơ hội việc làm phù hợp với bạn
            </p>
          </div>

          {/* Search */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Tìm kiếm công ty..."
                  className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-900 focus:ring-4 focus:ring-white/30 outline-none"
                />
              </div>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-4 py-4 rounded-xl text-gray-900 bg-white focus:ring-4 focus:ring-white/30 outline-none"
              >
                <option value="">Tất cả ngành nghề</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
              >
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">
              {filteredCompanies.length} Công ty
            </h2>
            <p className="text-gray-600">Các công ty đang tuyển dụng</p>
          </div>
          {isAuthenticated && (
            <Link
              href="/companies/create"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <Plus className="h-5 w-5" />
              Thêm công ty
            </Link>
          )}
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Đang tải...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadCompanies}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-24">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy công ty</h3>
            <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-purple-200 transition-all group"
              >
                <div className="flex items-start gap-4 mb-4">
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                      {company.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                      {company.name}
                    </h3>
                    {company.industry && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {company.industry}
                      </span>
                    )}
                  </div>
                </div>

                {company.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {company.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-500">
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
                  {company.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

