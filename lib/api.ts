import { Job } from '@/types';

// Backend API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types matching backend API
export interface BackendJob {
  id: string;
  companyId: string;
  company?: {
    id: string;
    name: string;
    description: string;
    website: string;
    logoUrl: string;
    industry: string;
    companySize: string;
    location: string;
    foundedYear: string;
  };
  title: string;
  level: string; // ENTRY, JUNIOR, MID, SENIOR, LEAD
  jobType: string; // FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  location: string;
  postedAt: string;
  experienceRequirement: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  jobTech: string[];
  createdAt: string;
}

export interface JobsListResponse {
  jobs: BackendJob[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  website: string;
  logoUrl: string;
  industry: string;
  companySize: string;
  location: string;
  foundedYear: string;
}

export interface CompaniesListResponse {
  companies: Company[];
  total: number;
  page: number;
  pageSize: number;
}

// Convert backend level to frontend experience
function mapLevelToExperience(level: string): 'entry' | 'mid' | 'senior' | 'lead' {
  const mapping: Record<string, 'entry' | 'mid' | 'senior' | 'lead'> = {
    'ENTRY': 'entry',
    'JUNIOR': 'entry',
    'MID': 'mid',
    'SENIOR': 'senior',
    'LEAD': 'lead',
  };
  return mapping[level] || 'mid';
}

// Convert backend jobType to frontend type
function mapJobType(jobType: string): 'full-time' | 'part-time' | 'contract' | 'internship' {
  const mapping: Record<string, 'full-time' | 'part-time' | 'contract' | 'internship'> = {
    'FULL_TIME': 'full-time',
    'PART_TIME': 'part-time',
    'CONTRACT': 'contract',
    'INTERNSHIP': 'internship',
  };
  return mapping[jobType] || 'full-time';
}

// Convert frontend experience to backend level
function mapExperienceToLevel(experience: string): string {
  const mapping: Record<string, string> = {
    'entry': 'ENTRY',
    'mid': 'MID',
    'senior': 'SENIOR',
    'lead': 'LEAD',
  };
  return mapping[experience] || 'MID';
}

// Convert frontend type to backend jobType
function mapTypeToJobType(type: string): string {
  const mapping: Record<string, string> = {
    'full-time': 'FULL_TIME',
    'part-time': 'PART_TIME',
    'contract': 'CONTRACT',
    'internship': 'INTERNSHIP',
  };
  return mapping[type] || 'FULL_TIME';
}

// Safe date parsing
function parseDate(dateString: string | undefined | null): Date {
  if (!dateString) return new Date();
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return new Date();
    }
    return date;
  } catch {
    return new Date();
  }
}

// Convert backend job to frontend Job type
function convertBackendJob(backendJob: BackendJob): Job {
  return {
    id: backendJob.id,
    title: backendJob.title,
    company: backendJob.company?.name || 'Unknown Company',
    companyLogo: backendJob.company?.logoUrl || undefined,
    location: backendJob.location,
    type: mapJobType(backendJob.jobType),
    salary: backendJob.salaryMin && backendJob.salaryMax ? {
      min: backendJob.salaryMin,
      max: backendJob.salaryMax,
      currency: backendJob.salaryCurrency || 'USD',
    } : undefined,
    description: backendJob.description,
    requirements: backendJob.requirements?.split('\n').filter(r => r.trim()) || [],
    benefits: backendJob.benefits?.split('\n').filter(b => b.trim()) || [],
    jobTech: backendJob.jobTech || [], // Technical skills from backend
    postedDate: parseDate(backendJob.postedAt || backendJob.createdAt),
    category: backendJob.company?.industry || 'Technology',
    remote: backendJob.location?.toLowerCase().includes('remote') || false,
    experience: mapLevelToExperience(backendJob.level),
  };
}

// Fetch jobs from backend
export async function fetchJobs(params?: {
  query?: string;
  location?: string;
  type?: string;
  remote?: boolean;
  experience?: string;
  page?: number;
  pageSize?: number;
}): Promise<Job[]> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params?.query) searchParams.append('keyword', params.query);
    if (params?.location) searchParams.append('location', params.location);
    if (params?.type) searchParams.append('jobType', mapTypeToJobType(params.type));
    if (params?.experience) searchParams.append('level', mapExperienceToLevel(params.experience));
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    
    const url = `${API_BASE_URL}/api/v1/jobs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: JobsListResponse = await response.json();
    
    // Convert backend jobs to frontend format
    return (data.jobs || []).map(convertBackendJob);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
}

// Fetch a single job by ID
export async function fetchJobById(id: string): Promise<Job | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: BackendJob = await response.json();
    return convertBackendJob(data);
  } catch (error) {
    console.error('Error fetching job:', error);
    throw error;
  }
}

// Get raw backend job (for detail page)
export async function fetchBackendJobById(id: string): Promise<BackendJob | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching job:', error);
    throw error;
  }
}

// Create a new job posting
export async function createJob(jobData: {
  companyId: string;
  title: string;
  level: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  location: string;
  experienceRequirement?: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  jobTech?: string[];
  active?: boolean;
}, token: string): Promise<BackendJob> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(jobData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
}

// Update a job posting
export async function updateJob(id: string, jobData: Partial<BackendJob>, token: string): Promise<BackendJob> {
  try {
    console.log('[API] Updating job:', {
      url: `${API_BASE_URL}/api/v1/jobs/${id}`,
      method: 'PUT',
      body: jobData
    });
    
    const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${id}`, {
      method: 'PATCH', // Changed from PUT to PATCH
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(jobData),
    });
    
    console.log('[API] Update response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Update error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      const errorMsg = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMsg);
    }
    
    const result = await response.json();
    console.log('[API] Update success:', result);
    return result;
  } catch (error) {
    console.error('[API] Error updating job:', error);
    throw error;
  }
}

// Delete a job posting
export async function deleteJob(id: string, token: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
}

// Fetch companies
export async function fetchCompanies(params?: {
  industry?: string;
  location?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<CompaniesListResponse> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params?.industry) searchParams.append('industry', params.industry);
    if (params?.location) searchParams.append('location', params.location);
    if (params?.keyword) searchParams.append('keyword', params.keyword);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    
    const url = `${API_BASE_URL}/api/v1/companies${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
}

// Fetch a single company by ID
export async function fetchCompanyById(id: string): Promise<Company | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/companies/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
}

// Auth APIs
export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Login failed');
  }
  
  return await response.json();
}

export async function register(data: {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role?: string;
  companyId?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      phoneNumber: data.phoneNumber,
      role: data.role || 'USER', // Must be uppercase: USER, HR, ADMIN
      companyId: data.companyId,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Registration failed');
  }
  
  return await response.json();
}

export async function getProfile(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get profile');
  }
  
  return await response.json();
}

// ==================== TRACKING ====================
// NOTE: Job search tracking is AUTOMATIC - built into ListJobPostings API on backend
// When logged-in users call fetchJobs(), backend automatically tracks the search filters

// ==================== CV-JOB MATCHING/SCORING ====================

export interface CVSkills {
  skills: string[];
  experience: { title: string; company: string }[];
  education: { degree: string; institution: string }[];
}

export interface JobRequirements {
  jobTech: string[];
  level: string;
  title: string;
  requirements?: string;
  description?: string;
}

export interface MatchScore {
  overall: number; // 0-100
  skillMatch: number; // 0-100
  experienceMatch: number; // 0-100
  details: {
    matchedSkills: string[];
    missingSkills: string[];
    relevantExperience: boolean;
  };
}

// Calculate how well a CV matches a job
export function calculateMatchScore(cv: CVSkills, job: JobRequirements): MatchScore {
  const cvSkillsLower = cv.skills.map(s => s.toLowerCase().trim());
  const jobSkillsLower = job.jobTech?.map(s => s.toLowerCase().trim()) || [];
  
  // Extract keywords from job description/requirements
  const descKeywords = extractKeywords(job.description || '');
  const reqKeywords = extractKeywords(job.requirements || '');
  const allJobKeywords = [...new Set([...jobSkillsLower, ...descKeywords, ...reqKeywords])];
  
  // Skill matching
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  
  allJobKeywords.forEach(jobSkill => {
    const found = cvSkillsLower.some(cvSkill => 
      cvSkill.includes(jobSkill) || jobSkill.includes(cvSkill) ||
      isSimilarSkill(cvSkill, jobSkill)
    );
    if (found) {
      matchedSkills.push(jobSkill);
    } else {
      missingSkills.push(jobSkill);
    }
  });
  
  const skillMatch = allJobKeywords.length > 0 
    ? Math.round((matchedSkills.length / allJobKeywords.length) * 100)
    : 50; // Default if no skills specified
  
  // Experience matching (check if any experience title is relevant)
  const jobTitleKeywords = job.title.toLowerCase().split(/\s+/);
  const relevantExperience = cv.experience.some(exp => {
    const expTitle = exp.title.toLowerCase();
    return jobTitleKeywords.some(kw => expTitle.includes(kw));
  });
  
  const experienceMatch = relevantExperience ? 80 : 40;
  
  // Level bonus
  const levelBonus = getLevelBonus(job.level, cv.experience.length);
  
  // Overall score
  const overall = Math.min(100, Math.round(
    (skillMatch * 0.6) + (experienceMatch * 0.3) + levelBonus
  ));
  
  console.log('📊 [Scoring] CV-Job Match:', {
    overall,
    skillMatch,
    experienceMatch,
    matchedSkills: matchedSkills.slice(0, 5),
    missingSkills: missingSkills.slice(0, 5),
  });
  
  return {
    overall,
    skillMatch,
    experienceMatch,
    details: {
      matchedSkills,
      missingSkills,
      relevantExperience,
    },
  };
}

// Extract tech keywords from text
function extractKeywords(text: string): string[] {
  const techKeywords = [
    'javascript', 'typescript', 'react', 'vue', 'angular', 'node', 'nodejs',
    'python', 'java', 'go', 'golang', 'rust', 'c++', 'c#', 'php', 'ruby',
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'k8s', 'terraform',
    'git', 'ci/cd', 'jenkins', 'github', 'gitlab', 'agile', 'scrum',
    'html', 'css', 'sass', 'tailwind', 'bootstrap', 'figma',
    'rest', 'api', 'graphql', 'microservices', 'kafka', 'rabbitmq',
    'linux', 'nginx', 'apache', 'devops', 'sre', 'frontend', 'backend',
  ];
  
  const textLower = text.toLowerCase();
  return techKeywords.filter(kw => textLower.includes(kw));
}

// Check if two skills are similar (synonyms/variants)
function isSimilarSkill(skill1: string, skill2: string): boolean {
  const synonyms: Record<string, string[]> = {
    'javascript': ['js', 'ecmascript'],
    'typescript': ['ts'],
    'nodejs': ['node', 'node.js'],
    'golang': ['go'],
    'postgresql': ['postgres', 'psql'],
    'mongodb': ['mongo'],
    'kubernetes': ['k8s'],
    'reactjs': ['react', 'react.js'],
    'vuejs': ['vue', 'vue.js'],
    'angularjs': ['angular'],
  };
  
  for (const [key, values] of Object.entries(synonyms)) {
    const allVariants = [key, ...values];
    if (allVariants.includes(skill1) && allVariants.includes(skill2)) {
      return true;
    }
  }
  return false;
}

// Get bonus based on experience level match
function getLevelBonus(jobLevel: string, experienceCount: number): number {
  const levelMap: Record<string, number> = {
    'ENTRY': 0,
    'JUNIOR': 1,
    'MID': 2,
    'SENIOR': 3,
    'LEAD': 4,
  };
  
  const requiredLevel = levelMap[jobLevel] || 2;
  const cvLevel = Math.min(experienceCount, 4); // Cap at 4
  
  if (cvLevel >= requiredLevel) return 10;
  if (cvLevel === requiredLevel - 1) return 5;
  return 0;
}

// Get score color based on value
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-500';
}

// Get score label
export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Rất phù hợp';
  if (score >= 60) return 'Phù hợp';
  if (score >= 40) return 'Tạm được';
  return 'Ít phù hợp';
}

// ==================== JOB VIEW TIME TRACKING ====================

/**
 * Track user's time on job detail page
 * This is called when user views a job for more than 2 minutes
 * 
 * @param jobId - The ID of the job being viewed
 * @param timeOnSight - Time spent viewing the job (in seconds)
 * @param token - User's access token (required)
 */
export async function trackJobViewTime(
  jobId: string, 
  timeOnSight: number, 
  token: string
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/tracking/jd_tos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        job_id: jobId,
        time_on_sight: timeOnSight,
      }),
    });
    
    if (!response.ok) {
      // Don't throw for tracking errors - just log them
      console.warn('Failed to track job view time:', response.status);
      return;
    }
    
    console.log('📊 [Tracking] Job view time tracked:', { jobId, timeOnSight });
  } catch (error) {
    // Silently fail for tracking - don't affect user experience
    console.warn('Error tracking job view time:', error);
  }
}

// ==================== RESUME APIS ====================

export interface ResumeDetail {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  education: { degree: string; institution: string; graduation_year: string }[];
  experience: { title: string; company: string; duration: string; responsibilities: string[]; achievements: string[] }[];
  certifications: string[];
  languages: string[];
}

export interface Resume {
  id: string;
  userId: string;
  resumeDetail: ResumeDetail;
  version: number;
  createdAt: string;
}

export interface ResumesListResponse {
  resumes: Resume[];
  total: number;
  page: number;
  pageSize: number;
}

// Get all resumes for current user
export async function fetchResumes(token: string, page = 1, pageSize = 50): Promise<ResumesListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/resumes?page=${page}&pageSize=${pageSize}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch resumes');
  }
  
  return await response.json();
}

// Get a single resume by ID
export async function fetchResumeById(id: string, token: string): Promise<Resume | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/resumes/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch resume');
  }
  
  return await response.json();
}

// Create a new resume
export async function createResume(resumeDetail: ResumeDetail, token: string): Promise<Resume> {
  const response = await fetch(`${API_BASE_URL}/api/v1/resumes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ resume_detail: resumeDetail }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create resume');
  }
  
  return await response.json();
}

// Update a resume
export async function updateResume(id: string, resumeDetail: ResumeDetail, token: string): Promise<Resume> {
  const response = await fetch(`${API_BASE_URL}/api/v1/resumes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ resume_detail: resumeDetail }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update resume');
  }
  
  return await response.json();
}

// Delete a resume
export async function deleteResume(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/resumes/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete resume');
  }
}

// Update CV Edit Status (accept/reject suggestions)
export async function updateCVEditStatus(
  resumeId: string,
  editId: string,
  status: 'accepted' | 'rejected',
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/resumes/${resumeId}/cv-edits/${editId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update CV edit status');
  }
}

// Generate CV description using ChatGPT
export async function generateCVDescription(
  resumeDetail: {
    name?: string;
    email?: string;
    phone?: string;
    summary?: string;
    skills?: string[];
    education?: { degree: string; institution: string; graduation_year: string; description?: string }[];
    experience?: { title: string; company: string; duration: string; description?: string; responsibilities?: string[]; achievements?: string[] }[];
    projects?: { name: string; description: string; url?: string; technologies?: string[]; duration?: string; role?: string; achievements?: string[] }[];
    certifications?: string[];
    languages?: string[];
  },
  token: string,
  fieldTag: 'summary' | 'experience_description' | 'education_description' | 'project_description' = 'summary',
  currentInput?: string
): Promise<{ content: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/resumes/generate-description`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      resume_detail: resumeDetail,
      field_tag: fieldTag,
      current_input: currentInput || '',
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to generate description');
  }
  
  return await response.json();
}

// ==================== ASYNC RESUME UPLOAD ====================

export interface ResumeUploadResponse {
  success: boolean;
  message: string;
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ResumeJobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_name?: string;
  error_message?: string;
  resume_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Upload resume async (returns job_id for tracking)
export async function uploadResumeAsync(file: File, token: string): Promise<ResumeUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/api/v1/resumes/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to upload resume');
  }
  
  return await response.json();
}

// Get resume parse job status (for polling fallback)
export async function getResumeJobStatus(jobId: string, token: string): Promise<ResumeJobStatus> {
  const response = await fetch(`${API_BASE_URL}/api/v1/resumes/job-status?job_id=${jobId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get job status');
  }
  
  return await response.json();
}

// ==================== JOB APPLICATION APIS ====================

export interface ApplicationJobInfo {
  id: string;
  title: string;
  companyName: string;
  location: string;
}

export interface JobApplicationInfo {
  id: string;
  userId: string;
  resumeId: string;
  jobId: string;
  applicantName: string;
  university?: string;
  status: 'APPLIED' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';
  appliedAt: string;
  updatedAt: string;
  jobInfo?: ApplicationJobInfo;
}

export interface JobApplicationDetail extends JobApplicationInfo {
  hrNote?: string;
  resumeDetail?: ResumeDetail;
}

export interface ApplicationsListResponse {
  applications: JobApplicationInfo[];
  total: number;
  page: number;
  pageSize: number;
}

// Apply for a job
export async function applyForJob(jobId: string, resumeId: string, token: string): Promise<JobApplicationInfo> {
  const response = await fetch(`${API_BASE_URL}/api/v1/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ job_id: jobId, resume_id: resumeId }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to apply for job');
  }
  
  const data = await response.json();
  return data.application;
}

// Get application detail
export async function getApplicationById(id: string, token: string): Promise<JobApplicationDetail | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/applications/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to get application');
  }
  
  const data = await response.json();
  return data.application;
}

// Get user's applications
export async function getUserApplications(token: string, page = 1, pageSize = 20): Promise<ApplicationsListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/applications?page=${page}&pageSize=${pageSize}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get applications');
  }
  
  return await response.json();
}

// Withdraw application
export async function withdrawApplication(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/applications/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to withdraw application');
  }
}

// ==================== MY JOBS (HR/RECRUITER) ====================

export interface MyJobsResponse {
  jobs: BackendJob[];
  total: number;
  page: number;
  pageSize: number;
}

// Get jobs created by current user
export async function getMyCreatedJobs(
  token: string,
  page = 1,
  pageSize = 50,
  includeInactive = true
): Promise<MyJobsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/my-created-jobs?page=${page}&pageSize=${pageSize}&includeInactive=${includeInactive}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get my created jobs');
  }

  return await response.json();
}

// Get jobs for current user/company (ListMyJobs)
export async function getMyJobs(
  token: string,
  page = 1,
  pageSize = 50,
  companyId?: string,
  includeInactive = true
): Promise<MyJobsResponse> {
  let url = `${API_BASE_URL}/api/v1/my-jobs?page=${page}&pageSize=${pageSize}&includeInactive=${includeInactive}`;
  if (companyId) {
    url += `&companyId=${companyId}`;
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get my jobs');
  }

  return await response.json();
}

// ==================== HR/RECRUITER APIS ====================

// Get applications for a specific job (for HR)
export async function getJobApplications(
  jobId: string, 
  token: string, 
  page = 1, 
  pageSize = 20,
  status?: 'APPLIED' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED'
): Promise<ApplicationsListResponse> {
  let url = `${API_BASE_URL}/api/v1/jobs/${jobId}/applications?page=${page}&pageSize=${pageSize}`;
  if (status) {
    const statusMap = { 'APPLIED': 0, 'REVIEWING': 1, 'ACCEPTED': 2, 'REJECTED': 3 };
    url += `&status=${statusMap[status]}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get job applications');
  }
  
  return await response.json();
}

// Update application status (for HR)
export async function updateApplicationStatus(
  applicationId: string, 
  status: 'APPLIED' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED',
  hrNote: string,
  token: string
): Promise<JobApplicationInfo> {
  const statusMap = { 'APPLIED': 0, 'REVIEWING': 1, 'ACCEPTED': 2, 'REJECTED': 3 };
  
  const response = await fetch(`${API_BASE_URL}/api/v1/applications/${applicationId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ 
      status: statusMap[status],
      hr_note: hrNote 
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update application status');
  }
  
  const data = await response.json();
  return data.application;
}

// Get application detail (for HR - includes full resume)
export async function getApplicationDetail(id: string, token: string): Promise<JobApplicationInfo> {
  const response = await fetch(`${API_BASE_URL}/api/v1/applications/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get application detail');
  }
  
  const data = await response.json();
  return data.application;
}

// ==================== SAVED JOBS APIS ====================

export interface SavedJobsResponse {
  jobs: BackendJob[];
  total: number;
  page: number;
  pageSize: number;
}

// Save a job
export async function saveJob(jobId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/saved-jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ job_id: jobId }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to save job');
  }
}

// Unsave a job
export async function unsaveJob(jobId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/saved-jobs/${jobId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to unsave job');
  }
}

// Get saved jobs
export async function getSavedJobs(token: string, page = 1, pageSize = 20): Promise<SavedJobsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/saved-jobs?page=${page}&pageSize=${pageSize}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get saved jobs');
  }
  
  return await response.json();
}

// ==================== NOTIFICATIONS APIS ====================

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  objectId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsListResponse {
  notifications: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
}

// Get user notifications
export async function getNotifications(token: string, page = 1, pageSize = 20): Promise<NotificationsListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/notifications?page=${page}&pageSize=${pageSize}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get notifications');
  }
  
  return await response.json();
}

// Get unread count
export async function getUnreadNotificationCount(token: string): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/api/v1/notifications/unread-count`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    return 0;
  }
  
  const data = await response.json();
  return data.count || 0;
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/notifications/read-all`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to mark all notifications as read');
  }
}

// ==================== WEBSOCKET ====================

export function getWebSocketURL(token: string): string {
  const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
  const wsHost = API_BASE_URL.replace(/^https?:\/\//, '');
  return `${wsProtocol}://${wsHost}/ws?token=${token}`;
}

// ==================== CV Evaluation APIs ====================

/**
 * Get jobs for evaluation (viewed + saved jobs)
 */
export async function getJobsForEvaluation(token: string): Promise<{
  viewed_jobs: Array<{
    id: string;
    title: string;
    company_name: string;
    location: string;
    time_on_sight: number;
  }>;
  saved_jobs: Array<{
    id: string;
    title: string;
    company_name: string;
    location: string;
    time_on_sight: number;
  }>;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/evaluation/jobs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching jobs for evaluation:', error);
    throw error;
  }
}

/**
 * Evaluate resume with specific job
 */
export async function evaluateWithJD(
  resumeId: string,
  jobId: string,
  token: string
): Promise<{ evaluation: any }> {
  try {
    console.log('[API] Evaluating with JD:', { resumeId, jobId });
    
    const response = await fetch(`${API_BASE_URL}/api/v1/evaluation/evaluate-with-jd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        resume_id: resumeId,
        job_id: jobId,
      }),
    });

    console.log('[API] Evaluate response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Evaluate error:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('[API] Evaluate success:', result);
    return result;
  } catch (error) {
    console.error('[API] Error evaluating with JD:', error);
    throw error;
  }
}

// Export API URL for other uses
export { API_BASE_URL };
