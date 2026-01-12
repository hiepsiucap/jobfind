'use client';

import { useState } from 'react';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateCVDescription } from '@/lib/api';
import { CompareDescriptionModal } from '@/components/ui/CompareDescriptionModal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResumeDetailType = Parameters<typeof generateCVDescription>[0];

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  duration: string;
  responsibilities: string;
  achievements: string;
}

interface ExperienceFormProps {
  experiences: ExperienceItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof ExperienceItem, value: string) => void;
  getResumeDetail?: () => ResumeDetailType;
  accessToken?: string;
}

const ExperienceForm = ({
  experiences,
  onAdd,
  onRemove,
  onChange,
  getResumeDetail,
  accessToken,
}: ExperienceFormProps) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [pendingExpId, setPendingExpId] = useState<string | null>(null);

  const handleGenerateAI = async (exp: ExperienceItem) => {
    if (!getResumeDetail || !accessToken) {
      toast.error('Vui lòng điền thông tin CV trước khi sử dụng tính năng này');
      return;
    }

    // currentInput = nội dung user đã nhập vào responsibilities
    const currentInput = exp.responsibilities?.trim();
    if (!currentInput) {
      toast.error('Vui lòng nhập mô tả trước để AI cải thiện');
      return;
    }

    setGeneratingId(exp.id);
    try {
      // Pass the user's current input for AI to improve
      const resumeDetail = getResumeDetail();
      const result = await generateCVDescription(resumeDetail, accessToken, 'experience_description', currentInput);
      
      // Lưu nội dung cũ và mới để so sánh
      setOriginalContent(currentInput);
      setGeneratedContent(result.content);
      setPendingExpId(exp.id);
      setShowCompareModal(true);
    } catch (err) {
      console.error('Failed to generate:', err);
      toast.error('Không thể tạo mô tả');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleConfirmChange = () => {
    if (pendingExpId) {
      onChange(pendingExpId, 'responsibilities', generatedContent);
      toast.success('Đã cải thiện mô tả công việc bằng AI!');
      setPendingExpId(null);
    }
  };

  // Check if AI button should be disabled for an experience
  const isAIDisabled = (exp: ExperienceItem) => {
    return !exp.responsibilities?.trim() || generatingId === exp.id;
  };

  return (
    <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
            3
          </span>
          Kinh nghiệm làm việc
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm
        </button>
      </div>

      <div className="space-y-3">
        {experiences.map((exp, index) => (
          <div
            key={exp.id}
            className="bg-white rounded-lg p-3 border border-blue-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">
                Kinh nghiệm #{index + 1}
              </span>
              <div className="flex items-center gap-1">
                {getResumeDetail && accessToken && (
                  <button
                    type="button"
                    onClick={() => handleGenerateAI(exp)}
                    disabled={isAIDisabled(exp)}
                    title={!exp.responsibilities?.trim() ? 'Nhập mô tả trước để AI cải thiện' : 'Cải thiện mô tả bằng AI'}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingId === exp.id ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Đang tạo...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        <span>AI</span>
                      </>
                    )}
                  </button>
                )}
                {experiences.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemove(exp.id)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    title="Xóa kinh nghiệm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={exp.title}
                  onChange={(e) => onChange(exp.id, 'title', e.target.value)}
                  placeholder="Vị trí/Chức danh"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none bg-white"
                />
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => onChange(exp.id, 'company', e.target.value)}
                  placeholder="Tên công ty"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none bg-white"
                />
              </div>

              <input
                type="text"
                value={exp.duration}
                onChange={(e) => onChange(exp.id, 'duration', e.target.value)}
                placeholder="Thời gian (vd: 2020 - 2023)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none bg-white"
              />

              <textarea
                value={exp.responsibilities}
                onChange={(e) => onChange(exp.id, 'responsibilities', e.target.value)}
                rows={2}
                placeholder="Trách nhiệm chính (mỗi dòng 1 mục)..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none resize-none bg-white"
              />

              <textarea
                value={exp.achievements}
                onChange={(e) => onChange(exp.id, 'achievements', e.target.value)}
                rows={2}
                placeholder="Thành tích nổi bật (mỗi dòng 1 mục)..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none resize-none bg-white"
              />
            </div>
          </div>
        ))}
      </div>
      
      {getResumeDetail && experiences.length > 0 && (
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-blue-500" />
          Nhập mô tả trước, sau đó nhấn AI để cải thiện nội dung
        </p>
      )}
      {!getResumeDetail && experiences.length > 0 && (
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-blue-500" />
          Điền thông tin để sử dụng tính năng AI cải thiện mô tả
        </p>
      )}

      {/* Modal so sánh nội dung cũ và mới */}
      <CompareDescriptionModal
        isOpen={showCompareModal}
        onClose={() => {
          setShowCompareModal(false);
          setPendingExpId(null);
        }}
        onConfirm={handleConfirmChange}
        title="So sánh mô tả công việc"
        oldContent={originalContent}
        newContent={generatedContent}
      />
    </div>
  );
};

// Helper function to create empty experience
export const createEmptyExperience = (): ExperienceItem => ({
  id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  title: '',
  company: '',
  duration: '',
  responsibilities: '',
  achievements: '',
});

export default ExperienceForm;
