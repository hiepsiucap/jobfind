/** @format */

"use client";

import { useState } from "react";
import { Plus, Trash2, Sparkles, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import { vi } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { generateCVDescription } from "@/lib/api";
import { CompareDescriptionModal } from "@/components/ui/CompareDescriptionModal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResumeDetailType = Parameters<typeof generateCVDescription>[0];

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  graduation_year: string;
  gpa?: string;
  description?: string;
}

interface EducationFormProps {
  educations: EducationItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof EducationItem, value: string) => void;
  getResumeDetail?: () => ResumeDetailType;
  accessToken?: string;
}

const EducationForm = ({
  educations,
  onAdd,
  onRemove,
  onChange,
  getResumeDetail,
  accessToken,
}: EducationFormProps) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [pendingEduId, setPendingEduId] = useState<string | null>(null);

  const handleGenerateAI = async (edu: EducationItem) => {
    if (!getResumeDetail || !accessToken) {
      toast.error("Vui lòng điền thông tin CV trước khi sử dụng tính năng này");
      return;
    }

    // currentInput = nội dung user đã nhập vào description
    const currentInput = edu.description?.trim();
    if (!currentInput) {
      toast.error("Vui lòng nhập mô tả trước để AI cải thiện");
      return;
    }

    setGeneratingId(edu.id);
    try {
      // Pass the user's current input for AI to improve
      const resumeDetail = getResumeDetail();
      const result = await generateCVDescription(
        resumeDetail,
        accessToken,
        "education_description",
        currentInput
      );

      // Lưu nội dung cũ và mới để so sánh
      setOriginalContent(currentInput);
      setGeneratedContent(result.content);
      setPendingEduId(edu.id);
      setShowCompareModal(true);
    } catch (err) {
      console.error("Failed to generate:", err);
      toast.error("Không thể tạo mô tả");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleConfirmChange = () => {
    if (pendingEduId) {
      onChange(pendingEduId, "description", generatedContent);
      toast.success("Đã cải thiện mô tả học vấn bằng AI!");
      setPendingEduId(null);
    }
  };

  // Check if AI button should be disabled for an education
  const isAIDisabled = (edu: EducationItem) => {
    return !edu.description?.trim() || generatingId === edu.id;
  };

  return (
    <div className="bg-green-50/50 rounded-lg p-3 border border-green-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">
            4
          </span>
          Học vấn
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm
        </button>
      </div>

      <div className="space-y-3">
        {educations.map((edu, index) => (
          <div
            key={edu.id}
            className="bg-white rounded-lg p-3 border border-green-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">
                Học vấn #{index + 1}
              </span>
              <div className="flex items-center gap-1">
                {getResumeDetail && accessToken && (
                  <button
                    type="button"
                    onClick={() => handleGenerateAI(edu)}
                    disabled={isAIDisabled(edu)}
                    title={
                      !edu.description?.trim()
                        ? "Nhập mô tả trước để AI cải thiện"
                        : "Cải thiện mô tả bằng AI"
                    }
                    className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-600 bg-green-100 hover:bg-green-200 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingId === edu.id ? (
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
                {educations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemove(edu.id)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    title="Xóa học vấn"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => onChange(edu.id, "degree", e.target.value)}
                placeholder="Bằng cấp (vd: Cử nhân CNTT)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-100 outline-none bg-white"
              />

              <div className="grid grid-cols-4 gap-2">
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) =>
                    onChange(edu.id, "institution", e.target.value)
                  }
                  placeholder="Trường/Tổ chức"
                  className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-100 outline-none bg-white"
                />
                <div className="relative">
                  <DatePicker
                    selected={edu.graduation_year ? new Date(parseInt(edu.graduation_year), 0, 1) : null}
                    onChange={(date: Date | null) => {
                      const year = date ? date.getFullYear().toString() : "";
                      onChange(edu.id, "graduation_year", year);
                    }}
                    showYearPicker
                    dateFormat="yyyy"
                    locale={vi}
                    placeholderText="Năm TN"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-100 outline-none bg-white pl-9"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                <input
                  type="text"
                  value={edu.gpa || ""}
                  onChange={(e) =>
                    onChange(edu.id, "gpa", e.target.value)
                  }
                  placeholder="GPA"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-100 outline-none bg-white"
                />
              </div>

              <textarea
                value={edu.description || ""}
                onChange={(e) =>
                  onChange(edu.id, "description", e.target.value)
                }
                rows={2}
                placeholder="Mô tả thêm về quá trình học tập, thành tích..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-100 outline-none resize-none bg-white"
              />
            </div>
          </div>
        ))}
      </div>

      {getResumeDetail && educations.length > 0 && (
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-green-500" />
          Nhập mô tả trước, sau đó nhấn AI để cải thiện nội dung
        </p>
      )}
      {!getResumeDetail && educations.length > 0 && (
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-green-500" />
          Điền thông tin để sử dụng tính năng AI cải thiện mô tả
        </p>
      )}

      {/* Modal so sánh nội dung cũ và mới */}
      <CompareDescriptionModal
        isOpen={showCompareModal}
        onClose={() => {
          setShowCompareModal(false);
          setPendingEduId(null);
        }}
        onConfirm={handleConfirmChange}
        title="So sánh mô tả học vấn"
        oldContent={originalContent}
        newContent={generatedContent}
      />
    </div>
  );
};

// Helper function to create empty education
export const createEmptyEducation = (): EducationItem => ({
  id: `edu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  degree: "",
  institution: "",
  graduation_year: "",
  gpa: "",
  description: "",
});

export default EducationForm;
