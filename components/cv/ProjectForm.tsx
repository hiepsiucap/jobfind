'use client';

import { useState } from 'react';
import { Plus, Trash2, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { generateCVDescription } from '@/lib/api';
import { CompareDescriptionModal } from '@/components/ui/CompareDescriptionModal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResumeDetailType = Parameters<typeof generateCVDescription>[0];

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  url: string;
  technologies: string;
  duration: string;
  role: string;
  achievements: string;
}

interface ProjectFormProps {
  projects: ProjectItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof ProjectItem, value: string) => void;
  getResumeDetail?: () => ResumeDetailType;
  accessToken?: string;
}

const ProjectForm = ({
  projects,
  onAdd,
  onRemove,
  onChange,
  getResumeDetail,
  accessToken,
}: ProjectFormProps) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [pendingProjId, setPendingProjId] = useState<string | null>(null);

  const handleGenerateAI = async (proj: ProjectItem) => {
    if (!getResumeDetail || !accessToken) {
      toast.error('Vui lòng điền thông tin CV trước khi sử dụng tính năng này');
      return;
    }

    // currentInput = nội dung user đã nhập vào description
    const currentInput = proj.description?.trim();
    if (!currentInput) {
      toast.error('Vui lòng nhập mô tả trước để AI cải thiện');
      return;
    }

    setGeneratingId(proj.id);
    try {
      // Pass the user's current input for AI to improve
      const resumeDetail = getResumeDetail();
      const result = await generateCVDescription(resumeDetail, accessToken, 'project_description', currentInput);
      
      // Lưu nội dung cũ và mới để so sánh
      setOriginalContent(currentInput);
      setGeneratedContent(result.content);
      setPendingProjId(proj.id);
      setShowCompareModal(true);
    } catch (err) {
      console.error('Failed to generate:', err);
      toast.error('Không thể tạo mô tả');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleConfirmChange = () => {
    if (pendingProjId) {
      onChange(pendingProjId, 'description', generatedContent);
      toast.success('Đã cải thiện mô tả dự án bằng AI!');
      setPendingProjId(null);
    }
  };

  // Check if AI button should be disabled for a project
  const isAIDisabled = (proj: ProjectItem) => {
    return !proj.description?.trim() || generatingId === proj.id;
  };

  return (
    <div className="bg-orange-50/50 rounded-lg p-3 border border-orange-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <span className="w-5 h-5 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs">
            5
          </span>
          Dự án
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-100 rounded-lg transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm
        </button>
      </div>

      <div className="space-y-3">
        {projects.map((proj, index) => (
          <div
            key={proj.id}
            className="bg-white rounded-lg p-3 border border-orange-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">
                Dự án #{index + 1}
              </span>
              <div className="flex items-center gap-1">
                {getResumeDetail && accessToken && (
                  <button
                    type="button"
                    onClick={() => handleGenerateAI(proj)}
                    disabled={isAIDisabled(proj)}
                    title={!proj.description?.trim() ? 'Nhập mô tả trước để AI cải thiện' : 'Cải thiện mô tả bằng AI'}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-orange-600 bg-orange-100 hover:bg-orange-200 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingId === proj.id ? (
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
                {projects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemove(proj.id)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    title="Xóa dự án"
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
                  value={proj.name}
                  onChange={(e) => onChange(proj.id, 'name', e.target.value)}
                  placeholder="Tên dự án"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-100 outline-none bg-white"
                />
                <input
                  type="text"
                  value={proj.role}
                  onChange={(e) => onChange(proj.id, 'role', e.target.value)}
                  placeholder="Vai trò (vd: Team Lead)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-100 outline-none bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={proj.duration}
                  onChange={(e) => onChange(proj.id, 'duration', e.target.value)}
                  placeholder="Thời gian (vd: 3 tháng)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-100 outline-none bg-white"
                />
                <div className="relative">
                  <input
                    type="text"
                    value={proj.url}
                    onChange={(e) => onChange(proj.id, 'url', e.target.value)}
                    placeholder="Link demo/Github"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-100 outline-none bg-white"
                  />
                  {proj.url && (
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              <input
                type="text"
                value={proj.technologies}
                onChange={(e) => onChange(proj.id, 'technologies', e.target.value)}
                placeholder="Công nghệ sử dụng (vd: React, Node.js, MongoDB)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-100 outline-none bg-white"
              />

              <textarea
                value={proj.description}
                onChange={(e) => onChange(proj.id, 'description', e.target.value)}
                rows={2}
                placeholder="Mô tả dự án, chức năng chính..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-100 outline-none resize-none bg-white"
              />

              <textarea
                value={proj.achievements}
                onChange={(e) => onChange(proj.id, 'achievements', e.target.value)}
                rows={2}
                placeholder="Thành tích nổi bật (mỗi dòng 1 mục)..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-100 outline-none resize-none bg-white"
              />
            </div>
          </div>
        ))}
      </div>
      
      {getResumeDetail && projects.length > 0 && (
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-orange-500" />
          Nhập mô tả trước, sau đó nhấn AI để cải thiện nội dung
        </p>
      )}
      {!getResumeDetail && projects.length > 0 && (
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-orange-500" />
          Điền thông tin để sử dụng tính năng AI cải thiện mô tả
        </p>
      )}

      {/* Modal so sánh nội dung cũ và mới */}
      <CompareDescriptionModal
        isOpen={showCompareModal}
        onClose={() => {
          setShowCompareModal(false);
          setPendingProjId(null);
        }}
        onConfirm={handleConfirmChange}
        title="So sánh mô tả dự án"
        oldContent={originalContent}
        newContent={generatedContent}
      />
    </div>
  );
};

// Helper function to create empty project
export const createEmptyProject = (): ProjectItem => ({
  id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name: '',
  description: '',
  url: '',
  technologies: '',
  duration: '',
  role: '',
  achievements: '',
});

export default ProjectForm;

