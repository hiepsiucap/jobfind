'use client';

import { Briefcase, Building2, DollarSign, Globe, SlidersHorizontal, ChevronRight, MapPin, Code } from 'lucide-react';
import Button from '@/components/ui/Button';

export const JOB_TYPES = [
  { value: '', label: 'Tất cả' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

export const EXPERIENCE_LEVELS = [
  { value: '', label: 'Tất cả' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
];

export const SALARY_RANGES = [
  { value: '', label: 'Tất cả' },
  { value: '0-1000', label: 'Dưới $1,000' },
  { value: '1000-2000', label: '$1,000 - $2,000' },
  { value: '2000-3000', label: '$2,000 - $3,000' },
  { value: '3000-5000', label: '$3,000 - $5,000' },
  { value: '5000+', label: 'Trên $5,000' },
];

interface JobFilterSidebarProps {
  jobType: string;
  experience: string;
  salaryRange: string;
  remoteOnly: boolean;
  selectedLocation?: string;
  selectedTechs?: string[];
  availableLocations?: string[];
  availableTechs?: string[];
  onJobTypeChange: (value: string) => void;
  onExperienceChange: (value: string) => void;
  onSalaryRangeChange: (value: string) => void;
  onRemoteOnlyChange: (value: boolean) => void;
  onLocationChange?: (value: string) => void;
  onTechsChange?: (values: string[]) => void;
  onApply: () => void;
  onReset: () => void;
  activeFiltersCount: number;
}

const JobFilterSidebar = ({
  jobType,
  experience,
  salaryRange,
  remoteOnly,
  selectedLocation = '',
  selectedTechs = [],
  availableLocations = [],
  availableTechs = [],
  onJobTypeChange,
  onExperienceChange,
  onSalaryRangeChange,
  onRemoteOnlyChange,
  onLocationChange,
  onTechsChange,
  onApply,
  onReset,
  activeFiltersCount,
}: JobFilterSidebarProps) => {
  const handleTechToggle = (tech: string) => {
    if (!onTechsChange) return;
    if (selectedTechs.includes(tech)) {
      onTechsChange(selectedTechs.filter(t => t !== tech));
    } else {
      onTechsChange([...selectedTechs, tech]);
    }
  };

  return (
    <div className="sticky top-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={onReset}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {/* Location Filter - Dynamic from jobs data */}
        {availableLocations.length > 0 && onLocationChange && (
          <FilterSection
            title="Địa điểm"
            icon={<MapPin className="h-4 w-4 text-gray-500" />}
          >
            <RadioOption
              key="all-locations"
              name="location"
              value=""
              label="Tất cả"
              checked={selectedLocation === ''}
              onChange={() => onLocationChange('')}
              colorClass="blue"
            />
            {availableLocations.slice(0, 6).map((loc) => (
              <RadioOption
                key={loc}
                name="location"
                value={loc}
                label={loc}
                checked={selectedLocation === loc}
                onChange={() => onLocationChange(loc)}
                colorClass="blue"
              />
            ))}
          </FilterSection>
        )}

        {/* Tech Stack Filter - Dynamic from jobs data */}
        {availableTechs.length > 0 && onTechsChange && (
          <FilterSection
            title="Công nghệ"
            icon={<Code className="h-4 w-4 text-gray-500" />}
          >
            <div className="flex flex-wrap gap-2">
              {availableTechs.slice(0, 12).map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => handleTechToggle(tech)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedTechs.includes(tech)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Job Type */}
        <FilterSection
          title="Loại hình công việc"
          icon={<Briefcase className="h-4 w-4 text-gray-500" />}
        >
          {JOB_TYPES.map((type) => (
            <RadioOption
              key={type.value}
              name="jobType"
              value={type.value}
              label={type.label}
              checked={jobType === type.value}
              onChange={() => onJobTypeChange(type.value)}
              colorClass="blue"
            />
          ))}
        </FilterSection>

        {/* Experience Level */}
        <FilterSection
          title="Cấp bậc"
          icon={<Building2 className="h-4 w-4 text-gray-500" />}
        >
          {EXPERIENCE_LEVELS.map((level) => (
            <RadioOption
              key={level.value}
              name="experience"
              value={level.value}
              label={level.label}
              checked={experience === level.value}
              onChange={() => onExperienceChange(level.value)}
              colorClass="purple"
            />
          ))}
        </FilterSection>

        {/* Salary Range */}
        <FilterSection
          title="Mức lương"
          icon={<DollarSign className="h-4 w-4 text-gray-500" />}
        >
          {SALARY_RANGES.map((range) => (
            <RadioOption
              key={range.value}
              name="salary"
              value={range.value}
              label={range.label}
              checked={salaryRange === range.value}
              onChange={() => onSalaryRangeChange(range.value)}
              colorClass="green"
            />
          ))}
        </FilterSection>

        {/* Remote */}
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-500" />
            Làm việc từ xa
          </h4>
          <button
            type="button"
            onClick={() => onRemoteOnlyChange(!remoteOnly)}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              remoteOnly
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🌍 Remote Only
          </button>
        </div>

        {/* Apply Button */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <Button onClick={onApply} className="w-full">
            Áp dụng bộ lọc
          </Button>
        </div>
      </div>
    </div>
  );
};

// Filter Section Component
interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const FilterSection = ({ title, icon, children }: FilterSectionProps) => (
  <div className="p-4 border-b border-gray-100">
    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
      {icon}
      {title}
    </h4>
    <div className="space-y-2">{children}</div>
  </div>
);

// Radio Option Component
interface RadioOptionProps {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  colorClass: 'blue' | 'purple' | 'green';
}

const RadioOption = ({ name, value, label, checked, onChange, colorClass }: RadioOptionProps) => {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50 text-blue-700',
      radio: 'text-blue-600 focus:ring-blue-500',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-700',
      radio: 'text-purple-600 focus:ring-purple-500',
    },
    green: {
      bg: 'bg-green-50 text-green-700',
      radio: 'text-green-600 focus:ring-green-500',
    },
  };

  return (
    <label
      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
        checked ? colorStyles[colorClass].bg : 'hover:bg-gray-50 text-gray-700'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className={`w-4 h-4 border-gray-300 ${colorStyles[colorClass].radio}`}
      />
      <span className="text-sm">{label}</span>
      {checked && value && <ChevronRight className="h-4 w-4 ml-auto" />}
    </label>
  );
};

export default JobFilterSidebar;


