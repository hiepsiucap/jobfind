/** @format */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  Download,
  Edit,
  RefreshCw,
  ArrowRight,
  X,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { CV } from "@/types";
import { Button } from "@/components/ui";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { exportToPdf } from "@/lib/exportPdf";
import {
  CVPreview,
  CVUpload,
  CVSidebar,
  CVList,
  CVSuggestions,
  CVEvaluations,
  BasicInfoForm,
  SummaryForm,
  ExperienceForm,
  EducationForm,
  SkillsForm,
  AdditionalInfoForm,
  createEmptyExperience,
  createEmptyEducation,
} from "@/components/cv";
import ProjectForm, { ProjectItem, createEmptyProject } from "@/components/cv/ProjectForm";
import CVPreviewPdf from "@/components/cv/CVPreviewPdf";
import type {
  CVTab,
  ExperienceItem,
  EducationItem,
  CVListItem,
} from "@/components/cv";

import { API_BASE_URL, updateCVEditStatus, evaluateWithJD } from "@/lib/api";
import SelectJobModal from "@/components/cv/SelectJobModal";

// Backend resume format
interface BackendEducation {
  degree: string;
  institution: string;
  graduation_year: string;
  gpa?: string;
  description?: string;
}

interface BackendExperience {
  title: string;
  company: string;
  duration: string;
  description?: string;
  responsibilities: string[];
  achievements: string[];
}

interface BackendProject {
  name: string;
  description: string;
  url: string;
  technologies: string[];
  duration: string;
  role: string;
  achievements: string[];
}

interface ResumeScoreBreakdown {
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  completenessScore: number;
  jobAlignmentScore: number;
  presentationScore: number;
}

interface ResumeCVEdit {
  id: string;
  fieldPath: string;
  action: string;
  currentValue: string;
  suggestedValue: string;
  reason: string;
  priority: string;
  impactScore: number;
  status: '' | 'pending' | 'accepted' | 'rejected'; // Empty string means not decided yet
}

interface ResumeEvaluation {
  cvName: string;
  overallScore: number;
  grade: string;
  scoreBreakdown: ResumeScoreBreakdown;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  cvEdits: ResumeCVEdit[];
  jobsAnalyzed: number;
  evaluatedAt: string;
}

interface ResumeDetail {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  education: BackendEducation[];
  experience: BackendExperience[];
  projects?: BackendProject[];
  certifications: string[];
  languages: string[];
  achievements?: string[];
  evaluations?: ResumeEvaluation[];
}

interface BackendResume {
  id: string;
  userId: string;
  resumeDetail: ResumeDetail;
  version: number;
  createdAt: string;
}

// Form data
interface ResumeFormData {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string;
  experiences: ExperienceItem[];
  educations: EducationItem[];
  projects: ProjectItem[];
  certifications: string;
  languages: string;
}

const emptyFormData: ResumeFormData = {
  name: "",
  email: "",
  phone: "",
  summary: "",
  skills: "",
  experiences: [createEmptyExperience()],
  educations: [createEmptyEducation()],
  projects: [createEmptyProject()],
  certifications: "",
  languages: "",
};

// Convert backend resume to frontend CV format
function convertBackendToCV(resume: BackendResume): CV {
  const detail = resume.resumeDetail;

  const experiences = Array.isArray(detail?.experience)
    ? detail.experience
    : detail?.experience
    ? [detail.experience]
    : [];

  const educations = Array.isArray(detail?.education)
    ? detail.education
    : detail?.education
    ? [detail.education]
    : [];

  const projects = Array.isArray(detail?.projects)
    ? detail.projects
    : detail?.projects
    ? [detail.projects]
    : [];

  return {
    id: resume.id,
    userId: resume.userId,
    personalInfo: {
      fullName: detail?.name || "",
      email: detail?.email || "",
      phone: detail?.phone || "",
      location: "",
      summary: detail?.summary || "",
    },
    experience: experiences.map((exp, idx) => ({
      id: `exp${idx}`,
      company: exp.company || "",
      position: exp.title || "",
      location: "",
      startDate: new Date(),
      current: true,
      description: exp.duration || "",
      achievements: [
        ...(exp.responsibilities || []),
        ...(exp.achievements || []),
      ],
    })),
    education: educations.map((edu, idx) => ({
      id: `edu${idx}`,
      institution: edu.institution || "",
      degree: edu.degree || "",
      field: "",
      location: "",
      startDate: new Date(),
      endDate: edu.graduation_year
        ? new Date(parseInt(edu.graduation_year), 0, 1)
        : undefined,
    })),
    skills: detail?.skills || [],
    projects: projects.map((proj, idx) => ({
      id: `proj${idx}`,
      name: proj.name || "",
      description: proj.description || "",
      url: proj.url || "",
      technologies: proj.technologies || [],
      duration: proj.duration || "",
      role: proj.role || "",
      achievements: proj.achievements || [],
    })),
    certifications: (detail?.certifications || []).map((cert, idx) => ({
      id: `cert${idx}`,
      name: cert,
      issuer: "",
      date: new Date(),
    })),
    languages: (detail?.languages || []).map((lang) => ({
      name: lang,
      proficiency: "intermediate" as const,
    })),
    createdAt: new Date(resume.createdAt),
    updatedAt: new Date(resume.createdAt),
  };
}

// Default empty CV
const emptyCV: CV = {
  id: "",
  userId: "",
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function CVPage() {
  const { isAuthenticated, user, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<CVTab | null>(null);

  // Multiple CVs support
  const [allResumes, setAllResumes] = useState<BackendResume[]>([]);
  const [selectedResume, setSelectedResume] = useState<BackendResume | null>(
    null
  );
  const [selectedCV, setSelectedCV] = useState<CV>(emptyCV);

  const [isLoadingCVs, setIsLoadingCVs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cvToDelete, setCvToDelete] = useState<CVListItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ResumeFormData>(emptyFormData);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Track applied CV edit suggestions locally
  const [appliedEditIds, setAppliedEditIds] = useState<Set<string>>(new Set());
  
  // CV Evaluation states
  const [showJobSelectModal, setShowJobSelectModal] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [applyingEditId, setApplyingEditId] = useState<string | null>(null);
  
  // PDF export
  const cvPreviewRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Convert backend resume to form data
  const resumeToFormData = (resume: BackendResume): ResumeFormData => {
    const detail = resume.resumeDetail;

    const experiences = Array.isArray(detail?.experience)
      ? detail.experience
      : detail?.experience
      ? [detail.experience]
      : [];

    const educations = Array.isArray(detail?.education)
      ? detail.education
      : detail?.education
      ? [detail.education]
      : [];

    const projects = Array.isArray(detail?.projects)
      ? detail.projects
      : detail?.projects
      ? [detail.projects]
      : [];

    return {
      name: detail?.name || "",
      email: detail?.email || "",
      phone: detail?.phone || "",
      summary: detail?.summary || "",
      skills: (detail?.skills || []).join(", "),
      experiences:
        experiences.length > 0
          ? experiences.map((exp, idx) => ({
              id: `exp_${idx}_${Date.now()}`,
              title: exp.title || "",
              company: exp.company || "",
              duration: exp.duration || "",
              responsibilities: (exp.responsibilities || []).join("\n"),
              achievements: (exp.achievements || []).join("\n"),
            }))
          : [createEmptyExperience()],
      educations:
        educations.length > 0
          ? educations.map((edu, idx) => ({
              id: `edu_${idx}_${Date.now()}`,
              degree: edu.degree || "",
              institution: edu.institution || "",
              graduation_year: edu.graduation_year || "",
              gpa: edu.gpa || "",
              description: edu.description || "",
            }))
          : [createEmptyEducation()],
      projects:
        projects.length > 0
          ? projects.map((proj, idx) => ({
              id: `proj_${idx}_${Date.now()}`,
              name: proj.name || "",
              description: proj.description || "",
              url: proj.url || "",
              technologies: (proj.technologies || []).join(", "),
              duration: proj.duration || "",
              role: proj.role || "",
              achievements: (proj.achievements || []).join("\n"),
            }))
          : [createEmptyProject()],
      certifications: (detail?.certifications || []).join("\n"),
      languages: (detail?.languages || []).join(", "),
    };
  };

  // Convert form data to API payload
  const formDataToResumeDetail = (form: ResumeFormData): ResumeDetail => {
    return {
      name: form.name,
      email: form.email,
      phone: form.phone,
      summary: form.summary,
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      education: form.educations
        .filter((edu) => edu.degree || edu.institution)
        .map((edu) => ({
          degree: edu.degree,
          institution: edu.institution,
          graduation_year: edu.graduation_year,
          gpa: edu.gpa,
          description: edu.description,
        })),
      experience: form.experiences
        .filter((exp) => exp.title || exp.company)
        .map((exp) => ({
          title: exp.title,
          company: exp.company,
          duration: exp.duration,
          responsibilities: exp.responsibilities
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          achievements: exp.achievements
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        })),
      projects: form.projects
        .filter((proj) => proj.name || proj.description)
        .map((proj) => ({
          name: proj.name,
          description: proj.description,
          url: proj.url,
          technologies: proj.technologies
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          duration: proj.duration,
          role: proj.role,
          achievements: proj.achievements
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        })),
      certifications: form.certifications
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      languages: form.languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  };

  // Experience handlers
  const handleAddExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experiences: [...prev.experiences, createEmptyExperience()],
    }));
  };

  const handleRemoveExperience = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      experiences:
        prev.experiences.length > 1
          ? prev.experiences.filter((exp) => exp.id !== id)
          : prev.experiences,
    }));
  };

  const handleExperienceChange = (
    id: string,
    field: keyof ExperienceItem,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  // Education handlers
  const handleAddEducation = () => {
    setFormData((prev) => ({
      ...prev,
      educations: [...prev.educations, createEmptyEducation()],
    }));
  };

  const handleRemoveEducation = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      educations:
        prev.educations.length > 1
          ? prev.educations.filter((edu) => edu.id !== id)
          : prev.educations,
    }));
  };

  const handleEducationChange = (
    id: string,
    field: keyof EducationItem,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      educations: prev.educations.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  // Project handlers
  const handleAddProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [...prev.projects, createEmptyProject()],
    }));
  };

  const handleRemoveProject = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      projects:
        prev.projects.length > 1
          ? prev.projects.filter((proj) => proj.id !== id)
          : prev.projects,
    }));
  };

  const handleProjectChange = (
    id: string,
    field: keyof ProjectItem,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === id ? { ...proj, [field]: value } : proj
      ),
    }));
  };

  // Get current resume detail for AI generation
  const getResumeDetail = () => {
    return {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      summary: formData.summary,
      skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
      education: formData.educations
        .filter((edu) => edu.degree || edu.institution)
        .map((edu) => ({
          degree: edu.degree,
          institution: edu.institution,
          graduation_year: edu.graduation_year,
          gpa: edu.gpa,
          description: edu.description,
        })),
      experience: formData.experiences
        .filter((exp) => exp.title || exp.company)
        .map((exp) => ({
          title: exp.title,
          company: exp.company,
          duration: exp.duration,
          responsibilities: exp.responsibilities.split("\n").map((s) => s.trim()).filter(Boolean),
          achievements: exp.achievements.split("\n").map((s) => s.trim()).filter(Boolean),
        })),
      projects: formData.projects
        .filter((proj) => proj.name || proj.description)
        .map((proj) => ({
          name: proj.name,
          description: proj.description,
          url: proj.url,
          technologies: proj.technologies.split(",").map((s) => s.trim()).filter(Boolean),
          duration: proj.duration,
          role: proj.role,
          achievements: proj.achievements.split("\n").map((s) => s.trim()).filter(Boolean),
        })),
      certifications: formData.certifications.split("\n").map((s) => s.trim()).filter(Boolean),
      languages: formData.languages.split(",").map((s) => s.trim()).filter(Boolean),
    };
  };

  // Select CV from list
  const handleSelectCV = (cvItem: CVListItem) => {
    const resume = allResumes.find((r) => r.id === cvItem.id);
    if (resume) {
      setSelectedResume(resume);
      setSelectedCV(convertBackendToCV(resume));
    }
  };

  // Edit handlers
  const handleStartEdit = (cvItem?: CVListItem) => {
    const resume = cvItem
      ? allResumes.find((r) => r.id === cvItem.id)
      : selectedResume;
    if (resume) {
      setSelectedResume(resume);
      setFormData(resumeToFormData(resume));
      setIsEditing(true);
      setActiveTab("generate");
      setSaveError(null);
    }
  };

  const handleStartCreate = () => {
    setSelectedResume(null);
    setIsEditing(false);
    if (user) {
      setFormData({
        ...emptyFormData,
        name: user.fullName || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
      });
    } else {
      setFormData(emptyFormData);
    }
    setActiveTab("generate");
    setSaveError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setActiveTab("view");
    setSaveError(null);
  };

  // Handle CV evaluation with selected job
  const handleEvaluateWithJob = async (jobId: string, jobTitle: string) => {
    if (!selectedResume || !accessToken) {
      toast.error('Vui lòng đăng nhập và chọn CV');
      return;
    }

    setIsEvaluating(true);
    setShowJobSelectModal(false);

    try {
      console.log('[CVPage] Evaluating CV with job:', { resumeId: selectedResume.id, jobId, jobTitle });
      
      const result = await evaluateWithJD(selectedResume.id, jobId, accessToken);
      
      if (result.evaluation) {
        // Convert backend evaluation to frontend format (support both camelCase and snake_case)
        const ev = result.evaluation;
        const sb = ev.score_breakdown || ev.scoreBreakdown || {};
        
        const newEvaluation = {
          cvName: ev.cv_name || ev.cvName || selectedResume.resumeDetail.name,
          overallScore: ev.overall_score || ev.overallScore || 0,
          grade: ev.grade || 'N/A',
          scoreBreakdown: {
            skillsScore: sb.skills_score || sb.skillsScore || 0,
            experienceScore: sb.experience_score || sb.experienceScore || 0,
            educationScore: sb.education_score || sb.educationScore || 0,
            completenessScore: sb.completeness_score || sb.completenessScore || 0,
            jobAlignmentScore: sb.job_alignment_score || sb.jobAlignmentScore || 0,
            presentationScore: sb.presentation_score || sb.presentationScore || 0,
          },
          strengths: ev.strengths || [],
          weaknesses: ev.weaknesses || [],
          recommendations: ev.recommendations || [],
          cvEdits: (ev.cv_edits || ev.cvEdits || []).map((edit: any) => ({
            id: edit.id,
            fieldPath: edit.field_path || edit.fieldPath,
            action: edit.action,
            currentValue: edit.current_value || edit.currentValue,
            suggestedValue: edit.suggested_value || edit.suggestedValue,
            reason: edit.reason,
            priority: edit.priority,
            impactScore: edit.impact_score || edit.impactScore,
            status: edit.status || '',
          })),
          jobsAnalyzed: ev.jobs_analyzed || ev.jobsAnalyzed || 1,
          evaluatedAt: ev.evaluated_at || ev.evaluatedAt || new Date().toISOString(),
          type: ev.type || 'manual',
          jobId: ev.job_id || ev.jobId || jobId,
          jobTitle: ev.job_title || ev.jobTitle || jobTitle,
        };

        // Update selectedResume with new evaluation
        setSelectedResume(prev => {
          if (!prev) return null;
          return {
            ...prev,
            resumeDetail: {
              ...prev.resumeDetail,
              evaluations: [newEvaluation, ...(prev.resumeDetail.evaluations || [])],
            },
          };
        });

        // Also update in allResumes list
        setAllResumes(prev => prev.map(r =>
          r.id === selectedResume.id
            ? {
                ...r,
                resumeDetail: {
                  ...r.resumeDetail,
                  evaluations: [newEvaluation, ...(r.resumeDetail.evaluations || [])],
                },
              }
            : r
        ));

        toast.success('Đánh giá CV theo công việc thành công!');
      } else {
        throw new Error('Invalid evaluation response');
      }
    } catch (err) {
      console.error('[CVPage] Evaluate failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Không thể đánh giá CV';
      toast.error(errorMsg);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Apply CV edit suggestion to form data
  const applyEditSuggestion = async (edit: ResumeCVEdit) => {
    const { fieldPath, suggestedValue } = edit;
    
    // First, make sure we're in edit mode with the current resume
    if (!selectedResume || !accessToken) return;
    
    setApplyingEditId(edit.id);
    
    try {
      // Call API to update status to 'accepted'
      await updateCVEditStatus(selectedResume.id, edit.id, 'accepted', accessToken);
      
      // Update local state to mark as applied
      setAppliedEditIds(prev => new Set([...prev, edit.id]));
      
      // Load form data from current resume if not already editing
      const currentFormData = isEditing ? formData : resumeToFormData(selectedResume);
      
      // Parse fieldPath and apply the change
      const updatedFormData = { ...currentFormData };
      
      // Handle simple fields
      if (fieldPath === 'summary') {
        updatedFormData.summary = suggestedValue;
      } else if (fieldPath === 'skills') {
        const existingSkills = updatedFormData.skills.split(',').map(s => s.trim()).filter(Boolean);
        const newSkills = suggestedValue.split(',').map(s => s.trim()).filter(Boolean);
        const merged = [...new Set([...existingSkills, ...newSkills])];
        updatedFormData.skills = merged.join(', ');
      } else if (fieldPath === 'name') {
        updatedFormData.name = suggestedValue;
      } else if (fieldPath === 'email') {
        updatedFormData.email = suggestedValue;
      } else if (fieldPath === 'phone') {
        updatedFormData.phone = suggestedValue;
      } else if (fieldPath === 'certifications') {
        const existing = updatedFormData.certifications.split('\n').map(s => s.trim()).filter(Boolean);
        if (!existing.includes(suggestedValue)) {
          existing.push(suggestedValue);
        }
        updatedFormData.certifications = existing.join('\n');
      } else if (fieldPath === 'languages') {
        const existing = updatedFormData.languages.split(',').map(s => s.trim()).filter(Boolean);
        const newLangs = suggestedValue.split(',').map(s => s.trim()).filter(Boolean);
        const merged = [...new Set([...existing, ...newLangs])];
        updatedFormData.languages = merged.join(', ');
      }
      // Handle experience array paths
      else if (fieldPath.startsWith('experience')) {
        const match = fieldPath.match(/experience\[(\d+)\]\.(\w+)/);
        if (match) {
          const index = parseInt(match[1]);
          const field = match[2] as keyof ExperienceItem;
          if (updatedFormData.experiences[index]) {
            (updatedFormData.experiences[index] as unknown as Record<string, string>)[field] = suggestedValue;
          }
        } else if (fieldPath === 'experience') {
          try {
            const newExp = JSON.parse(suggestedValue);
            updatedFormData.experiences.push({
              id: `exp_new_${Date.now()}`,
              title: newExp.title || '',
              company: newExp.company || '',
              duration: newExp.duration || '',
              responsibilities: Array.isArray(newExp.responsibilities) ? newExp.responsibilities.join('\n') : (newExp.responsibilities || ''),
              achievements: Array.isArray(newExp.achievements) ? newExp.achievements.join('\n') : (newExp.achievements || ''),
            });
          } catch {
            if (updatedFormData.experiences[0]) {
              const current = updatedFormData.experiences[0].achievements;
              updatedFormData.experiences[0].achievements = current ? `${current}\n${suggestedValue}` : suggestedValue;
            }
          }
        }
      }
      // Handle education array paths
      else if (fieldPath.startsWith('education')) {
        const match = fieldPath.match(/education\[(\d+)\]\.(\w+)/);
        if (match) {
          const index = parseInt(match[1]);
          const field = match[2] as keyof EducationItem;
          if (updatedFormData.educations[index]) {
            (updatedFormData.educations[index] as unknown as Record<string, string>)[field] = suggestedValue;
          }
        }
      }
      // Handle project array paths
      else if (fieldPath.startsWith('project')) {
        const match = fieldPath.match(/projects?\[(\d+)\]\.(\w+)/);
        if (match) {
          const index = parseInt(match[1]);
          const field = match[2] as keyof ProjectItem;
          if (updatedFormData.projects[index]) {
            (updatedFormData.projects[index] as unknown as Record<string, string>)[field] = suggestedValue;
          }
        }
      }
      
      // Set form data and switch to edit mode
      setFormData(updatedFormData);
      setSelectedResume(selectedResume);
      setIsEditing(true);
      setActiveTab("generate");
      setSaveError(null);
      
      toast.success(`Đã áp dụng gợi ý vào "${fieldPath}". Nhấn "Cập nhật CV" để lưu.`);
    } catch (err) {
      console.error('Failed to apply edit:', err);
      toast.error('Không thể áp dụng gợi ý. Vui lòng thử lại.');
    } finally {
      setApplyingEditId(null);
    }
  };

  // Delete CV - open confirmation modal
  const handleDeleteCV = (cvItem: CVListItem) => {
    setCvToDelete(cvItem);
    setDeleteModalOpen(true);
  };

  // Confirm delete CV
  const confirmDeleteCV = async () => {
    if (!accessToken || !cvToDelete) return;

    setIsDeleting(cvToDelete.id);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/resumes/${cvToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Không thể xóa CV");
      }

      // Remove from list
      setAllResumes((prev) => prev.filter((r) => r.id !== cvToDelete.id));

      // If deleted CV was selected, clear selection
      if (selectedResume?.id === cvToDelete.id) {
        setSelectedResume(null);
        setSelectedCV(emptyCV);
      }

      toast.success("Đã xóa CV thành công");
      setDeleteModalOpen(false);
      setCvToDelete(null);
    } catch (err) {
      console.error("Delete CV error:", err);
      toast.error(err instanceof Error ? err.message : "Không thể xóa CV. Vui lòng thử lại.");
    } finally {
      setIsDeleting(null);
    }
  };

  // Save CV
  const handleSaveCV = async () => {
    if (!accessToken) {
      setSaveError("Vui lòng đăng nhập để lưu CV");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const resumeDetail = formDataToResumeDetail(formData);

      let response;
      if (isEditing && selectedResume?.id) {
        response = await fetch(
          `${API_BASE_URL}/api/v1/resumes/${selectedResume.id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ resume_detail: resumeDetail }),
          }
        );
      } else {
        response = await fetch(`${API_BASE_URL}/api/v1/resumes`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ resume_detail: resumeDetail }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Lỗi: ${response.status}`);
      }

      const savedResume = await response.json();

      // Update list
      if (isEditing) {
        setAllResumes((prev) =>
          prev.map((r) => (r.id === savedResume.id ? savedResume : r))
        );
      } else {
        setAllResumes((prev) => [savedResume, ...prev]);
      }

      setSelectedResume(savedResume);
      setSelectedCV(convertBackendToCV(savedResume));
      setIsEditing(false);
      setActiveTab("view");

      toast.success(isEditing ? "CV đã được cập nhật!" : "CV đã được tạo thành công!");
    } catch (err) {
      console.error("Failed to save CV:", err);
      setSaveError(err instanceof Error ? err.message : "Không thể lưu CV");
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch all CVs
  const fetchAllCVs = useCallback(async () => {
    if (!accessToken) {
      setIsLoadingCVs(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/resumes?page=1&pageSize=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const resumes = (data.resumes || []) as BackendResume[];
        setAllResumes(resumes);

        // Auto-select first CV if available
        if (resumes.length > 0 && !selectedResume) {
          setSelectedResume(resumes[0]);
          setSelectedCV(convertBackendToCV(resumes[0]));

          // Save CV skills to localStorage for job matching
          const detail = resumes[0].resumeDetail;
          if (detail) {
            const cvSkills = {
              skills: detail.skills || [],
              experience: (detail.experience || []).map((exp) => ({
                title: exp.title || "",
                company: exp.company || "",
              })),
              education: (detail.education || []).map((edu) => ({
                degree: edu.degree || "",
                institution: edu.institution || "",
              })),
            };
            localStorage.setItem("userCV", JSON.stringify(cvSkills));
            console.log(
              "📄 [CV] Saved skills for job matching:",
              cvSkills.skills
            );
          }
        } else if (resumes.length === 0) {
          // Clear CV data from localStorage when user has no CVs
          localStorage.removeItem("userCV");
          console.log("📄 [CV] No CVs found, cleared localStorage");
        }
      }
    } catch (err) {
      console.error("Failed to fetch CVs:", err);
    } finally {
      setIsLoadingCVs(false);
    }
  }, [accessToken, selectedResume]);

  // Effects
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchAllCVs();
    } else {
      setIsLoadingCVs(false);
    }
  }, [isAuthenticated, accessToken, fetchAllCVs]);

  useEffect(() => {
    if (activeTab === null) {
      setActiveTab("view");
    }
  }, [activeTab]);

  // Handlers for upload
  const handleUpload = (file: File) => {
    // File uploaded
  };

  const handleParse = () => {
    // Refresh the list after parsing
    fetchAllCVs();
    setActiveTab("view");
  };

  const handleResetForm = () => {
    if (user) {
      setFormData({
        ...emptyFormData,
        name: user.fullName || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
      });
    } else {
      setFormData(emptyFormData);
    }
    setSaveError(null);
  };

  // Export PDF handler
  const handleExportPdf = async () => {
    if (!cvPreviewRef.current) {
      toast.error("Không tìm thấy nội dung CV để xuất");
      return;
    }

    setIsExportingPdf(true);
    try {
      const filename = selectedCV.personalInfo.fullName
        ? `CV_${selectedCV.personalInfo.fullName.replace(/\s+/g, "_")}.pdf`
        : "CV.pdf";
      
      await exportToPdf(cvPreviewRef.current, {
        filename,
        margin: 10,
        scale: 2,
        format: "a4",
      });
      
      toast.success("Đã xuất PDF thành công!");
    } catch (err) {
      console.error("Failed to export PDF:", err);
      toast.error(err instanceof Error ? err.message : "Không thể xuất PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handler for adding skills from suggestions
  const handleAddSuggestedSkill = (skill: string) => {
    const currentSkills = formData.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!currentSkills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      const newSkills = [...currentSkills, skill].join(", ");
      setFormData((prev) => ({ ...prev, skills: newSkills }));
    }
  };

  // Parse current skills for suggestions component
  const currentSkillsArray = formData.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const currentExperienceArray = formData.experiences
    .filter((exp) => exp.title || exp.company)
    .map((exp) => ({ title: exp.title, company: exp.company }));

  const currentEducationArray = formData.educations
    .filter((edu) => edu.degree || edu.institution)
    .map((edu) => ({ degree: edu.degree, institution: edu.institution }));

  // Convert resumes to list items
  const cvListItems: CVListItem[] = allResumes.map((resume) => ({
    id: resume.id,
    resumeDetail: resume.resumeDetail,
    version: resume.version,
    createdAt: resume.createdAt,
  }));

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex h-full">
        {/* Left Sidebar */}
        <CVSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 h-full">
            {/* View Tab */}
            {activeTab === "view" && (
              <div className="h-full flex gap-3">
                {/* CV List Panel - Compact */}
                <div className="w-56 flex-shrink-0 overflow-y-auto bg-white rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-sm font-bold text-gray-900">
                      CV của tôi
                    </h1>
                    <div className="flex gap-1">
                      <button
                        onClick={fetchAllCVs}
                        disabled={isLoadingCVs}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all disabled:opacity-50"
                        title="Làm mới"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${
                            isLoadingCVs ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={handleStartCreate}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-all"
                        title="Tạo mới"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {isLoadingCVs ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : !isAuthenticated ? (
                    <div className="text-center py-6">
                      <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-xs mb-2">
                        Đăng nhập để xem CV
                      </p>
                      <a
                        href="/login"
                        className="inline-block px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-xs font-medium"
                      >
                        Đăng nhập
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {cvListItems.length === 0 ? (
                        <div className="text-center py-6">
                          <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs">Chưa có CV</p>
                        </div>
                      ) : (
                        cvListItems.map((cv) => (
                          <div
                            key={cv.id}
                            onClick={() => handleSelectCV(cv)}
                            className={`p-2 rounded-lg cursor-pointer transition-all group ${
                              selectedResume?.id === cv.id
                                ? "bg-blue-50 border border-blue-200"
                                : "hover:bg-gray-50 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className={`h-4 w-4 flex-shrink-0 ${
                                selectedResume?.id === cv.id ? "text-blue-600" : "text-gray-400"
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium truncate ${
                                  selectedResume?.id === cv.id ? "text-blue-900" : "text-gray-700"
                                }`}>
                                  {cv.resumeDetail?.name || "Chưa có tên"}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  v{cv.version}
                                </p>
                              </div>
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEdit(cv);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                  title="Sửa"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCV(cv);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Xóa"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Main Content - CV Preview and Evaluations side by side */}
                <div className="flex-1 min-w-0 flex gap-3">
                {/* CV Preview Panel */}
                <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-sm font-bold text-gray-900">
                      {selectedCV.personalInfo.fullName || "Xem trước CV"}
                    </h2>
                    {selectedResume && (
                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowJobSelectModal(true)}
                            disabled={isEvaluating}
                            leftIcon={
                              isEvaluating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <span className="text-xs">⭐</span>
                              )
                            }
                            className="text-xs px-2 py-1"
                          >
                            {isEvaluating ? "..." : "Đánh giá"}
                          </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEdit()}
                            leftIcon={<Edit className="h-3 w-3" />}
                            className="text-xs px-2 py-1"
                        >
                          Sửa
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleExportPdf}
                          disabled={isExportingPdf}
                          leftIcon={
                            isExportingPdf ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Download className="h-3 w-3" />
                            )
                          }
                            className="text-xs px-2 py-1"
                        >
                            {isExportingPdf ? "..." : "PDF"}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-h-0 overflow-auto">
                    {selectedCV.personalInfo.fullName ? (
                        <CVPreview cv={selectedCV} />
                      ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center h-full flex items-center justify-center">
                        <div>
                            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {allResumes.length > 0
                              ? "Chọn CV để xem"
                              : "Chưa có CV nào"}
                          </h3>
                            <p className="text-gray-500 text-xs mb-3">
                            {allResumes.length > 0
                                ? "Chọn một CV từ danh sách bên trái"
                                : "Tạo CV mới hoặc upload CV"}
                          </p>
                          {allResumes.length === 0 && isAuthenticated && (
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={handleStartCreate}
                                  className="text-xs"
                              >
                                  Tạo CV
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveTab("upload")}
                                  className="text-xs"
                              >
                                  Upload
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  </div>

                  {/* CV Evaluations Panel - Side by side */}
                  {selectedResume?.resumeDetail?.evaluations && 
                   selectedResume.resumeDetail.evaluations.length > 0 && (
                    <div className="w-96 flex-shrink-0 flex flex-col">
                      <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                          <span className="text-white text-[10px]">★</span>
                        </span>
                        Đánh giá CV
                      </h2>
                      <div className="flex-1 min-h-0 overflow-auto">
                        <CVEvaluations
                          evaluations={selectedResume.resumeDetail.evaluations}
                          resumeId={selectedResume.id}
                          accessToken={accessToken || undefined}
                          onEditAccepted={(edit) => {
                            applyEditSuggestion(edit);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === "upload" && (
              <div className="h-full flex flex-col max-w-2xl">
                <div className="mb-3">
                  <h1 className="text-lg font-bold text-gray-900">
                    Upload & Parse CV
                  </h1>
                  <p className="text-sm text-gray-500">
                    Tải lên CV có sẵn để trích xuất thông tin tự động
                  </p>
                </div>

                <div className="flex-1">
                  <CVUpload
                    onUpload={handleUpload}
                    onParse={handleParse}
                    onSuccess={fetchAllCVs}
                  />

                  {!isAuthenticated && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ Bạn cần{" "}
                        <a
                          href="/login"
                          className="font-semibold underline"
                        >
                          đăng nhập
                        </a>{" "}
                        để sử dụng tính năng này
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Generate Tab */}
            {activeTab === "generate" && (
              <div className="h-full flex flex-col">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Edit className="h-5 w-5 text-blue-600" />
                          Chỉnh sửa CV
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5 text-green-600" />
                          Tạo CV mới
                        </>
                      )}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {isEditing
                        ? "Chỉnh sửa thông tin CV của bạn"
                        : "Điền thông tin để tạo CV mới"}
                    </p>
                  </div>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      Hủy
                    </Button>
                  )}
                </div>

                {saveError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                    <X className="h-4 w-4" />
                    {saveError}
                  </div>
                )}

                {/* Two-column layout: Form on left, Suggestions on right */}
                <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
                  {/* Left: Form */}
                  <div className="flex-1 min-w-0 overflow-y-auto pr-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                      <form
                        className="space-y-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveCV();
                        }}
                      >
                        <BasicInfoForm
                          name={formData.name}
                          email={formData.email}
                          phone={formData.phone}
                          onNameChange={(v) =>
                            setFormData((prev) => ({ ...prev, name: v }))
                          }
                          onEmailChange={(v) =>
                            setFormData((prev) => ({ ...prev, email: v }))
                          }
                          onPhoneChange={(v) =>
                            setFormData((prev) => ({ ...prev, phone: v }))
                          }
                        />

                        <SummaryForm
                          summary={formData.summary}
                          onChange={(v) =>
                            setFormData((prev) => ({ ...prev, summary: v }))
                          }
                          getResumeDetail={getResumeDetail}
                          accessToken={accessToken || undefined}
                        />

                        <ExperienceForm
                          experiences={formData.experiences}
                          onAdd={handleAddExperience}
                          onRemove={handleRemoveExperience}
                          onChange={handleExperienceChange}
                          getResumeDetail={getResumeDetail}
                          accessToken={accessToken || undefined}
                        />

                        <EducationForm
                          educations={formData.educations}
                          onAdd={handleAddEducation}
                          onRemove={handleRemoveEducation}
                          onChange={handleEducationChange}
                          getResumeDetail={getResumeDetail}
                          accessToken={accessToken || undefined}
                        />

                        <ProjectForm
                          projects={formData.projects}
                          onAdd={handleAddProject}
                          onRemove={handleRemoveProject}
                          onChange={handleProjectChange}
                          getResumeDetail={getResumeDetail}
                          accessToken={accessToken || undefined}
                        />

                        <SkillsForm
                          skills={formData.skills}
                          onChange={(v) =>
                            setFormData((prev) => ({ ...prev, skills: v }))
                          }
                        />

                        <AdditionalInfoForm
                          certifications={formData.certifications}
                          languages={formData.languages}
                          onCertificationsChange={(v) =>
                            setFormData((prev) => ({
                              ...prev,
                              certifications: v,
                            }))
                          }
                          onLanguagesChange={(v) =>
                            setFormData((prev) => ({ ...prev, languages: v }))
                          }
                        />

                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleResetForm}
                            className="flex-1"
                          >
                            Đặt lại
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSaving}
                            rightIcon={<ArrowRight className="h-4 w-4" />}
                            className="flex-1"
                          >
                            {isEditing ? "Cập nhật CV" : "Tạo CV"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Right: CV Evaluations + Suggestions */}
                  <div className="w-96 flex-shrink-0 overflow-y-auto space-y-4">
                    {/* CV Edit Suggestions from Evaluation (only when editing existing CV) */}
                    {isEditing && selectedResume?.resumeDetail?.evaluations && 
                     selectedResume.resumeDetail.evaluations.length > 0 && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white text-[10px]">✨</span>
                          </span>
                          Gợi ý cải thiện CV
                        </h3>
                        {selectedResume.resumeDetail.evaluations.map((evaluation, evalIdx) => (
                          <div key={evalIdx} className="space-y-2">
                            {evaluation.cvEdits && evaluation.cvEdits.length > 0 ? (
                              evaluation.cvEdits.map((edit) => {
                                const isApplied = edit.status === 'accepted' || appliedEditIds.has(edit.id);
                                const isRejected = edit.status === 'rejected';
                                const isPending = !isApplied && !isRejected && (!edit.status || (edit.status as string) === '' || edit.status === 'pending');
                                const isApplying = applyingEditId === edit.id;
                                
                                return (
                                  <div
                                    key={edit.id}
                                    className={`p-2.5 rounded-lg border text-sm ${
                                      isApplied ? 'bg-green-50 border-green-200' :
                                      isRejected ? 'bg-gray-50 border-gray-200 opacity-50' :
                                      'bg-purple-50 border-purple-200'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <span className="text-[10px] font-medium text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                                            {edit.fieldPath}
                                          </span>
                                          {edit.priority === 'high' && (
                                            <span className="text-[10px] text-red-600">⚡ Quan trọng</span>
                                          )}
                                        </div>
                                        {edit.currentValue && (
                                          <p className="text-[11px] text-gray-400 line-through mb-0.5 truncate">
                                            {edit.currentValue}
                                          </p>
                                        )}
                                        <p className="text-xs text-gray-800 font-medium line-clamp-2">
                                          {edit.suggestedValue}
                                        </p>
                                        {edit.reason && (
                                          <p className="text-[10px] text-gray-500 mt-1 italic line-clamp-2">
                                            💡 {edit.reason}
                                          </p>
                                        )}
                                      </div>
                                      
                                      {isPending && (
                                        <button
                                          type="button"
                                          onClick={() => applyEditSuggestion(edit)}
                                          disabled={isApplying}
                                          className="flex-shrink-0 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-medium rounded transition-colors disabled:opacity-50"
                                        >
                                          {isApplying ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            'Áp dụng'
                                          )}
                                        </button>
                                      )}
                                      {isApplied && (
                                        <span className="text-[10px] text-green-600 font-medium">✓ Đã áp dụng</span>
                                      )}
                                      {isRejected && (
                                        <span className="text-[10px] text-gray-400">Bỏ qua</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-xs text-gray-500 text-center py-2">
                                Không có gợi ý sửa đổi
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Skill Suggestions */}
                      <CVSuggestions
                        currentSkills={currentSkillsArray}
                        currentExperience={currentExperienceArray}
                        currentEducation={currentEducationArray}
                        onAddSkill={handleAddSuggestedSkill}
                        accessToken={accessToken || undefined}
                      />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Select Job Modal for Evaluation */}
      <SelectJobModal
        isOpen={showJobSelectModal}
        onClose={() => setShowJobSelectModal(false)}
        onSelect={handleEvaluateWithJob}
        accessToken={accessToken || undefined}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCvToDelete(null);
        }}
        onConfirm={confirmDeleteCV}
        title="Xóa CV"
        message={`Bạn có chắc muốn xóa CV "${cvToDelete?.resumeDetail?.name || 'này'}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa CV"
        cancelText="Hủy"
        isLoading={isDeleting === cvToDelete?.id}
        variant="danger"
      />

      {/* Hidden PDF Preview for export - uses inline styles for html2canvas compatibility */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        <CVPreviewPdf ref={cvPreviewRef} cv={selectedCV} />
      </div>
    </div>
  );
}
