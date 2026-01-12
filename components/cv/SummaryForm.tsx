'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateCVDescription } from '@/lib/api';
import { CompareDescriptionModal } from '@/components/ui/CompareDescriptionModal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResumeDetailType = Parameters<typeof generateCVDescription>[0];

interface SummaryFormProps {
  summary: string;
  onChange: (value: string) => void;
  getResumeDetail?: () => ResumeDetailType;
  accessToken?: string;
}

const SummaryForm = ({ summary, onChange, getResumeDetail, accessToken }: SummaryFormProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');

  const handleGenerateWithAI = async () => {
    if (!getResumeDetail || !accessToken) {
      toast.error('Vui lòng điền thông tin CV trước khi sử dụng tính năng này');
      return;
    }

    const currentInput = summary?.trim();
    if (!currentInput) {
      toast.error('Vui lòng nhập mô tả trước để AI cải thiện');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const resumeDetail = getResumeDetail();
      const result = await generateCVDescription(resumeDetail, accessToken, 'summary', currentInput);
      // Lưu nội dung cũ và mới để so sánh
      setOriginalContent(currentInput);
      setGeneratedContent(result.content);
      setShowCompareModal(true);
    } catch (err) {
      console.error('Failed to generate description:', err);
      const errorMsg = err instanceof Error ? err.message : 'Không thể tạo mô tả';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmChange = () => {
    onChange(generatedContent);
    toast.success('Đã cải thiện mô tả bằng AI!');
  };

  // Check if AI button should be disabled
  const isAIDisabled = !summary?.trim() || isGenerating;

  return (
    <div className="bg-purple-50/50 rounded-lg p-3 border border-purple-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <span className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">
            2
          </span>
          Giới thiệu bản thân
        </h3>
        {getResumeDetail && accessToken && (
          <button
            type="button"
            onClick={handleGenerateWithAI}
            disabled={isAIDisabled}
            title={!summary?.trim() ? 'Nhập mô tả trước để AI cải thiện' : 'Cải thiện mô tả bằng AI'}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang tạo...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI cải thiện</span>
              </>
            )}
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
          {error}
        </div>
      )}
      
      <textarea
        value={summary}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Mô tả ngắn gọn về bản thân và mục tiêu nghề nghiệp..."
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-100 outline-none resize-none bg-white"
      />
      
      {getResumeDetail && (
        <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-purple-500" />
          Nhập mô tả trước, sau đó nhấn AI để cải thiện nội dung
        </p>
      )}
      {!getResumeDetail && (
        <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-purple-500" />
          Điền thông tin để sử dụng tính năng AI cải thiện mô tả
        </p>
      )}

      {/* Modal so sánh nội dung cũ và mới */}
      <CompareDescriptionModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        onConfirm={handleConfirmChange}
        title="So sánh giới thiệu bản thân"
        oldContent={originalContent}
        newContent={generatedContent}
      />
    </div>
  );
};

export default SummaryForm;
