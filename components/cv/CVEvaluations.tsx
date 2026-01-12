'use client';

import { useState } from 'react';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Target,
  BookOpen,
  Briefcase,
  FileCheck,
  Layout,
} from 'lucide-react';
import { ResumeEvaluation, ResumeCVEdit } from '@/types';
import { updateCVEditStatus } from '@/lib/api';
import { toast } from 'sonner';

interface CVEvaluationsProps {
  evaluations: ResumeEvaluation[];
  resumeId: string;
  accessToken?: string;
  onEditAccepted?: (edit: ResumeCVEdit) => void;
}

const getGradeColor = (grade: string) => {
  switch (grade?.toUpperCase()) {
    case 'A':
    case 'A+':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'B':
    case 'B+':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'C':
    case 'C+':
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'D':
    case 'D+':
      return 'bg-orange-100 text-orange-700 border-orange-300';
    default:
      return 'bg-red-100 text-red-700 border-red-300';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-500';
};

const ScoreBar = ({ label, score, icon: Icon }: { label: string; score: number; icon: React.ElementType }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1 text-gray-600">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <span className={`font-medium ${getScoreColor(score)}`}>{score.toFixed(0)}</span>
    </div>
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          score >= 80 ? 'bg-green-500' :
          score >= 60 ? 'bg-blue-500' :
          score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
        }`}
        style={{ width: `${Math.min(100, score)}%` }}
      />
    </div>
  </div>
);

export default function CVEvaluations({ evaluations, resumeId, accessToken, onEditAccepted }: CVEvaluationsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [updatingEditId, setUpdatingEditId] = useState<string | null>(null);
  const [localEdits, setLocalEdits] = useState<Record<string, string>>({}); // editId -> status

  if (!evaluations || evaluations.length === 0) {
    return null;
  }

  const handleEditStatus = async (edit: ResumeCVEdit, status: 'accepted' | 'rejected') => {
    if (!accessToken) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    setUpdatingEditId(edit.id);
    try {
      await updateCVEditStatus(resumeId, edit.id, status, accessToken);
      setLocalEdits(prev => ({ ...prev, [edit.id]: status }));
      toast.success(status === 'accepted' ? 'Đã chấp nhận gợi ý' : 'Đã từ chối gợi ý');
      
      if (status === 'accepted' && onEditAccepted) {
        onEditAccepted(edit);
      }
    } catch (err) {
      toast.error('Không thể cập nhật');
    } finally {
      setUpdatingEditId(null);
    }
  };

  const getEditStatus = (edit: ResumeCVEdit) => {
    return localEdits[edit.id] || edit.status;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-medium rounded">Cao</span>;
      case 'medium':
        return <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-medium rounded">Trung bình</span>;
      default:
        return <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded">Thấp</span>;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-600" />
        Đánh giá CV ({evaluations.length})
      </h3>

      {evaluations.map((evaluation, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          {/* Header */}
          <button
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 font-bold text-lg ${getGradeColor(evaluation.grade)}`}>
                {evaluation.grade}
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{evaluation.cvName || `Đánh giá ${index + 1}`}</p>
                <p className="text-xs text-gray-500">
                  Điểm: <span className={`font-semibold ${getScoreColor(evaluation.overallScore)}`}>
                    {evaluation.overallScore.toFixed(0)}/100
                  </span>
                  {evaluation.jobsAnalyzed > 0 && (
                    <span className="ml-2">• {evaluation.jobsAnalyzed} công việc phân tích</span>
                  )}
                </p>
              </div>
            </div>
            {expandedIndex === index ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {/* Expanded Content */}
          {expandedIndex === index && (
            <div className="p-4 space-y-4">
              {/* Score Breakdown */}
              {evaluation.scoreBreakdown && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Chi tiết điểm số</p>
                  <ScoreBar label="Kỹ năng" score={evaluation.scoreBreakdown.skillsScore} icon={Target} />
                  <ScoreBar label="Kinh nghiệm" score={evaluation.scoreBreakdown.experienceScore} icon={Briefcase} />
                  <ScoreBar label="Học vấn" score={evaluation.scoreBreakdown.educationScore} icon={BookOpen} />
                  <ScoreBar label="Độ hoàn thiện" score={evaluation.scoreBreakdown.completenessScore} icon={FileCheck} />
                  <ScoreBar label="Phù hợp công việc" score={evaluation.scoreBreakdown.jobAlignmentScore} icon={TrendingUp} />
                  <ScoreBar label="Trình bày" score={evaluation.scoreBreakdown.presentationScore} icon={Layout} />
                </div>
              )}

              {/* Strengths */}
              {evaluation.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Điểm mạnh
                  </p>
                  <div className="space-y-1">
                    {evaluation.strengths.map((strength, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weaknesses */}
              {evaluation.weaknesses?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Điểm yếu
                  </p>
                  <div className="space-y-1">
                    {evaluation.weaknesses.map((weakness, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{weakness}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {evaluation.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" /> Đề xuất
                  </p>
                  <div className="space-y-1">
                    {evaluation.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CV Edits (Suggestions) */}
              {evaluation.cvEdits?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Gợi ý chỉnh sửa ({evaluation.cvEdits.length})
                  </p>
                  <div className="space-y-2">
                    {evaluation.cvEdits.map((edit) => {
                      const status = getEditStatus(edit);
                      const isProcessed = status !== 'pending';

                      return (
                        <div
                          key={edit.id}
                          className={`p-3 rounded-lg border ${
                            status === 'accepted' ? 'bg-green-50 border-green-200' :
                            status === 'rejected' ? 'bg-gray-50 border-gray-200 opacity-60' :
                            'bg-purple-50 border-purple-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-500">{edit.fieldPath}</span>
                                {getPriorityBadge(edit.priority)}
                                {edit.impactScore > 0 && (
                                  <span className="text-[10px] text-gray-400">
                                    Tác động: {(edit.impactScore * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                              
                              {edit.currentValue && (
                                <p className="text-xs text-gray-500 line-through mb-1">{edit.currentValue}</p>
                              )}
                              
                              <p className="text-sm text-gray-900 font-medium">{edit.suggestedValue}</p>
                              
                              {edit.reason && (
                                <p className="text-xs text-gray-600 mt-1 italic">{edit.reason}</p>
                              )}
                            </div>

                            {!isProcessed && accessToken && (
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleEditStatus(edit, 'accepted')}
                                  disabled={updatingEditId === edit.id}
                                  className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                                  title="Chấp nhận"
                                >
                                  {updatingEditId === edit.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleEditStatus(edit, 'rejected')}
                                  disabled={updatingEditId === edit.id}
                                  className="p-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg disabled:opacity-50 transition-colors"
                                  title="Từ chối"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}

                            {isProcessed && (
                              <span className={`text-xs font-medium ${
                                status === 'accepted' ? 'text-green-600' : 'text-gray-400'
                              }`}>
                                {status === 'accepted' ? '✓ Đã áp dụng' : '✕ Đã bỏ qua'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Evaluated At */}
              {evaluation.evaluatedAt && (
                <p className="text-xs text-gray-400 text-right">
                  Đánh giá lúc: {new Date(evaluation.evaluatedAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}





