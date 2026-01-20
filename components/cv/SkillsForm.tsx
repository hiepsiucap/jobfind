'use client';

interface SkillsFormProps {
  skills: string;
  onChange: (value: string) => void;
}

const SkillsForm = ({ skills, onChange }: SkillsFormProps) => {
  return (
    <div className="bg-orange-50/50 rounded-lg p-3 border border-orange-100">
      <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
        <span className="w-5 h-5 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs">
          5
        </span>
        Kỹ năng
      </h3>
      <input
        type="text"
        value={skills}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Các kỹ năng, cách nhau bởi dấu phẩy (vd: React, TypeScript, Node.js)"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-100 outline-none bg-white"
      />
      <p className="text-xs text-gray-500 mt-1">
        Nhập các kỹ năng cách nhau bởi dấu phẩy
      </p>
    </div>
  );
};

export default SkillsForm;














