'use client';

import Badge from '@/components/ui/Badge';
import { JOB_TYPES, EXPERIENCE_LEVELS, SALARY_RANGES } from './JobFilterSidebar';

interface JobFilterTagsProps {
  jobType: string;
  experience: string;
  salaryRange: string;
  remoteOnly: boolean;
  selectedLocation?: string;
  selectedTechs?: string[];
  onJobTypeRemove: () => void;
  onExperienceRemove: () => void;
  onSalaryRangeRemove: () => void;
  onRemoteOnlyRemove: () => void;
  onLocationRemove?: () => void;
  onTechRemove?: (tech: string) => void;
}

const JobFilterTags = ({
  jobType,
  experience,
  salaryRange,
  remoteOnly,
  selectedLocation,
  selectedTechs = [],
  onJobTypeRemove,
  onExperienceRemove,
  onSalaryRangeRemove,
  onRemoteOnlyRemove,
  onLocationRemove,
  onTechRemove,
}: JobFilterTagsProps) => {
  const hasFilters = jobType || experience || salaryRange || remoteOnly || selectedLocation || selectedTechs.length > 0;

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {selectedLocation && onLocationRemove && (
        <Badge variant="blue" onRemove={onLocationRemove}>
          📍 {selectedLocation}
        </Badge>
      )}
      {selectedTechs.map((tech) => (
        <Badge 
          key={tech} 
          variant="blue" 
          onRemove={onTechRemove ? () => onTechRemove(tech) : undefined}
        >
          💻 {tech}
        </Badge>
      ))}
      {jobType && (
        <Badge variant="blue" onRemove={onJobTypeRemove}>
          {JOB_TYPES.find((t) => t.value === jobType)?.label}
        </Badge>
      )}
      {experience && (
        <Badge variant="purple" onRemove={onExperienceRemove}>
          {EXPERIENCE_LEVELS.find((l) => l.value === experience)?.label}
        </Badge>
      )}
      {salaryRange && (
        <Badge variant="green" onRemove={onSalaryRangeRemove}>
          {SALARY_RANGES.find((r) => r.value === salaryRange)?.label}
        </Badge>
      )}
      {remoteOnly && (
        <Badge variant="orange" onRemove={onRemoteOnlyRemove}>
          🌍 Remote
        </Badge>
      )}
    </div>
  );
};

export default JobFilterTags;


