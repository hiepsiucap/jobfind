'use client';

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { calculateMatchScore, getScoreColor, getScoreLabel, MatchScore, CVSkills, JobRequirements } from '@/lib/api';

interface MatchScoreBadgeProps {
  job: JobRequirements;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

// Check if user is authenticated
function isUserAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}

// Get CV skills from localStorage (fetched from backend)
function getCVSkillsFromStorage(): CVSkills | null {
  if (typeof window === 'undefined') return null;
  
  // Only get CV data if user is authenticated
  if (!isUserAuthenticated()) {
    return null;
  }
  
  try {
    const cvData = localStorage.getItem('userCV');
    if (!cvData) return null;
    
    const cv = JSON.parse(cvData);
    
    // Validate that CV has actual skills data
    if (!cv.skills || cv.skills.length === 0) {
      return null;
    }
    
    return {
      skills: cv.skills || [],
      experience: cv.experience || [],
      education: cv.education || [],
    };
  } catch {
    return null;
  }
}

export default function MatchScoreBadge({ job, size = 'md', showDetails = false }: MatchScoreBadgeProps) {
  const [score, setScore] = useState<MatchScore | null>(null);
  const [cvSkills, setCvSkills] = useState<CVSkills | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const skills = getCVSkillsFromStorage();
    if (skills && skills.skills.length > 0) {
      setCvSkills(skills);
      const matchScore = calculateMatchScore(skills, job);
      setScore(matchScore);
    }
  }, [job]);

  // Don't render if no CV data
  if (!cvSkills || !score) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className="relative inline-block">
      <div
        className={`inline-flex items-center gap-1 rounded-full font-semibold cursor-pointer transition-all
          ${sizeClasses[size]}
          ${score.overall >= 70 
            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200' 
            : score.overall >= 50 
              ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200'
              : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border border-yellow-200'
          }
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Sparkles className={iconSizes[size]} />
        <span>{score.overall}%</span>
        <span className="hidden sm:inline">{getScoreLabel(score.overall)}</span>
      </div>

      {/* Tooltip with details - appears below on desktop, above on mobile */}
      {showTooltip && (
        <div className="absolute z-50 top-full left-0 mt-2 w-72 p-4 bg-white rounded-xl shadow-2xl border border-gray-200 text-sm">
          {/* Arrow pointing up */}
          <div className="absolute bottom-full left-4 mb-0">
            <div className="border-8 border-transparent border-b-white"></div>
          </div>
          
          <div className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Độ phù hợp với CV của bạn
          </div>
          
          <div className="space-y-3">
            {/* Score bars */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Tổng điểm</span>
                <span className={`font-bold ${getScoreColor(score.overall)}`}>
                  {score.overall}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${score.overall >= 70 ? 'bg-green-500' : score.overall >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                  style={{ width: `${score.overall}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Kỹ năng</span>
                <span className={`font-semibold ${getScoreColor(score.skillMatch)}`}>
                  {score.skillMatch}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${score.skillMatch}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Kinh nghiệm</span>
                <span className={`font-semibold ${getScoreColor(score.experienceMatch)}`}>
                  {score.experienceMatch}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${score.experienceMatch}%` }}
                />
              </div>
            </div>

            {/* Matched Skills */}
            {score.details.matchedSkills.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-700 mb-2">✅ Kỹ năng phù hợp:</p>
                <div className="flex flex-wrap gap-1.5">
                  {score.details.matchedSkills.slice(0, 6).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {score.details.matchedSkills.length > 6 && (
                    <span className="text-xs text-gray-400 py-1">
                      +{score.details.matchedSkills.length - 6} khác
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {score.details.missingSkills.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-700 mb-2">⚠️ Cần bổ sung:</p>
                <div className="flex flex-wrap gap-1.5">
                  {score.details.missingSkills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-md font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {score.details.missingSkills.length > 4 && (
                    <span className="text-xs text-gray-400 py-1">
                      +{score.details.missingSkills.length - 4} khác
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

