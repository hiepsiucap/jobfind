'use client';

import Link from 'next/link';
import { Job } from '@/types';
import { formatDateRelative, formatSalary } from '@/lib/utils';
import { Briefcase, MapPin, Clock, DollarSign, Building2 } from 'lucide-react';
import { MatchScoreBadge } from '@/components/jobs';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const jobTypeColors = {
    'full-time': 'bg-green-100 text-green-800',
    'part-time': 'bg-blue-100 text-blue-800',
    contract: 'bg-purple-100 text-purple-800',
    internship: 'bg-orange-100 text-orange-800',
  };

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-2xl hover:border-blue-200 transition-all cursor-pointer hover:-translate-y-1 h-full flex flex-col">
        {/* Header */}
        <div className="mb-5">
          {/* Company Logo */}
          <div className="flex items-start justify-between mb-4">
            {job.companyLogo ? (
              <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg group-hover:scale-110 transition-transform bg-white border border-gray-100">
                <img 
                  src={job.companyLogo} 
                  alt={`${job.company} logo`}
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"><svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div>';
                  }}
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            )}
            {job.remote && (
              <span className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
                🌍 Remote
              </span>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-display font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
              {job.title}
            </h3>
            <div className="flex items-center text-gray-600 mb-3">
              <span className="font-semibold text-sm">{job.company}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-2 mb-4 text-xs">
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="font-medium truncate">{job.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Briefcase className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className={`px-2.5 py-1 rounded-lg font-semibold text-xs ${jobTypeColors[job.type]}`}>
              {job.type}
            </span>
          </div>
          {job.salary && (
            <div className="flex items-center space-x-2 text-green-700">
              <DollarSign className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
              <span className="font-semibold">{formatSalary(job.salary)}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed flex-grow">{job.description}</p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.requirements.slice(0, 2).map((req, index) => (
            <span
              key={index}
              className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full border border-gray-200"
            >
              {req}
            </span>
          ))}
          {job.requirements.length > 2 && (
            <span className="text-gray-500 text-xs font-medium px-3 py-1 bg-gray-50 rounded-full border border-gray-200">
              +{job.requirements.length - 2}
            </span>
          )}
        </div>

        {/* Match Score Badge */}
        <div className="mb-3">
          <MatchScoreBadge
            job={{
              jobTech: job.jobTech || [],
              level: job.experience?.toUpperCase() || 'MID',
              title: job.title,
              description: job.description,
              requirements: job.requirements?.join('\n') || '',
            }}
            size="sm"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs pt-4 border-t border-gray-100 mt-auto">
          <div className="flex items-center space-x-1.5 text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-medium">{formatDateRelative(job.postedDate)}</span>
          </div>
          <span className="flex items-center gap-1 text-blue-600 font-semibold group-hover:gap-2 transition-all">
            View
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}


