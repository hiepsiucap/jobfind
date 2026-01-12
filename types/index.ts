// Core type definitions for the job website

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string; // URL to company logo image
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  benefits?: string[];
  jobTech?: string[]; // Technical skills/technologies required
  postedDate: Date;
  deadline?: Date;
  category: string;
  remote: boolean;
  experience: 'entry' | 'mid' | 'senior' | 'lead';
}

export interface CV {
  id: string;
  userId: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
    summary: string;
  };
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects?: Project[];
  certifications?: Certification[];
  languages?: Language[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  technologies: string[];
  duration?: string;
  role?: string;
  achievements?: string[];
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  gpa?: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: Date;
  expiryDate?: Date;
  credentialId?: string;
}

export interface Language {
  name: string;
  proficiency: 'basic' | 'intermediate' | 'advanced' | 'native';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'job_seeker' | 'employer';
  cvId?: string;
  savedJobs: string[];
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  resumeId: string;
  applicantName: string;
  university?: string;
  status: 'APPLIED' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';
  appliedAt: Date;
  updatedAt: Date;
  hrNote?: string;
  jobInfo?: {
    id: string;
    title: string;
    companyName: string;
    location: string;
  };
  resumeDetail?: ResumeDetail;
}

export interface ResumeScoreBreakdown {
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  completenessScore: number;
  jobAlignmentScore: number;
  presentationScore: number;
}

export interface ResumeCVEdit {
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

export interface ResumeEvaluation {
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

export interface ResumeDetail {
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

export interface BackendEducation {
  degree: string;
  institution: string;
  graduationYear: string;
  description?: string;
}

export interface BackendExperience {
  title: string;
  company: string;
  duration: string;
  description?: string;
  responsibilities: string[];
  achievements: string[];
}

export interface BackendProject {
  name: string;
  description: string;
  url?: string;
  technologies: string[];
  duration?: string;
  role?: string;
  achievements?: string[];
}

export interface Resume {
  id: string;
  userId: string;
  resumeDetail: ResumeDetail;
  version: number;
  createdAt: string;
}

// WebSocket Message Types
export type WSMessageType = 'job_status' | 'error' | 'ping' | 'pong';

export interface WSMessage {
  type: WSMessageType;
  payload: JobStatusPayload | ErrorPayload;
}

export interface JobStatusPayload {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  resumeId?: string;
  cvData?: ResumeDetail;
}

export interface ErrorPayload {
  message: string;
}

// Resume Parse Job
export interface ResumeParseJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName?: string;
  errorMessage?: string;
  resumeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

