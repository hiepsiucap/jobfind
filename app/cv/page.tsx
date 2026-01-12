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

import { API_BASE_URL } from "@/lib/api";

// Backend resume format
interface BackendEducation {
  degree: string;
  institution: string;
  graduation_year: string;
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
  status: 'pending' | 'accepted' | 'rejected';
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
              <div className="h-full flex gap-4">
                {/* CV List Panel */}
                <div className="w-80 flex-shrink-0 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h1 className="text-lg font-bold text-gray-900">
                      Danh sách CV
                    </h1>
                    <div className="flex gap-2">
                      <button
                        onClick={fetchAllCVs}
                        disabled={isLoadingCVs}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                        title="Làm mới"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${
                            isLoadingCVs ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleStartCreate}
                        leftIcon={<Plus className="h-3.5 w-3.5" />}
                      >
                        Tạo mới
                      </Button>
                    </div>
                  </div>

                  {isLoadingCVs ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : !isAuthenticated ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 p-6">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm mb-4">
                        Vui lòng đăng nhập để xem CV của bạn
                      </p>
                      <a
                        href="/login"
                        className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium"
                      >
                        Đăng nhập
                      </a>
                    </div>
                  ) : (
                    <CVList
                      cvs={cvListItems}
                      selectedId={selectedResume?.id}
                      onSelect={handleSelectCV}
                      onEdit={handleStartEdit}
                      onDelete={handleDeleteCV}
                      isDeleting={isDeleting}
                    />
                  )}
                </div>

                {/* CV Preview Panel */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold text-gray-900">
                      {selectedCV.personalInfo.fullName || "Xem trước CV"}
                    </h2>
                    {selectedResume && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEdit()}
                          leftIcon={<Edit className="h-3.5 w-3.5" />}
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
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )
                          }
                        >
                          {isExportingPdf ? "Đang xuất..." : "Tải PDF"}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-h-0 overflow-auto">
                    {selectedCV.personalInfo.fullName ? (
                      <div className="space-y-4">
                        <CVPreview cv={selectedCV} />
                        
                        {/* Show Evaluations if available */}
                        {selectedResume?.resumeDetail?.evaluations && 
                         selectedResume.resumeDetail.evaluations.length > 0 && (
                          <CVEvaluations
                            evaluations={selectedResume.resumeDetail.evaluations}
                            resumeId={selectedResume.id}
                            accessToken={accessToken || undefined}
                            onEditAccepted={(edit) => {
                              // Optionally update form data when an edit is accepted
                              toast.success(`Đã áp dụng: ${edit.suggestedValue}`);
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center h-full flex items-center justify-center">
                        <div>
                          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {allResumes.length > 0
                              ? "Chọn CV để xem"
                              : "Chưa có CV nào"}
                          </h3>
                          <p className="text-gray-500 text-sm mb-4">
                            {allResumes.length > 0
                              ? "Chọn một CV từ danh sách bên trái để xem chi tiết"
                              : "Tạo CV mới hoặc upload CV có sẵn để bắt đầu"}
                          </p>
                          {allResumes.length === 0 && isAuthenticated && (
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={handleStartCreate}
                              >
                                Tạo CV mới
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveTab("upload")}
                              >
                                Upload CV
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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

                  {/* Right: CV Suggestions */}
                  <div className="w-80 flex-shrink-0 overflow-y-auto">
                    <div className="sticky top-0">
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
              </div>
            )}
          </div>
        </div>
      </div>

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
