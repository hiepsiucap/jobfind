'use client';

interface AdditionalInfoFormProps {
  certifications: string;
  languages: string;
  onCertificationsChange: (value: string) => void;
  onLanguagesChange: (value: string) => void;
}

const AdditionalInfoForm = ({
  certifications,
  languages,
  onCertificationsChange,
  onLanguagesChange,
}: AdditionalInfoFormProps) => {
  return (
    <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200">
      <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
        <span className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs">
          6
        </span>
        Thông tin bổ sung
      </h3>

      <div className="space-y-3">
        {/* Certifications */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Chứng chỉ
          </label>
          <textarea
            value={certifications}
            onChange={(e) => onCertificationsChange(e.target.value)}
            rows={2}
            placeholder="Các chứng chỉ (mỗi dòng 1 chứng chỉ)..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-100 outline-none resize-none bg-white"
          />
        </div>

        {/* Languages */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Ngôn ngữ
          </label>
          <input
            type="text"
            value={languages}
            onChange={(e) => onLanguagesChange(e.target.value)}
            placeholder="Ngôn ngữ (vd: Tiếng Việt, English)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-100 outline-none bg-white"
          />
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfoForm;










