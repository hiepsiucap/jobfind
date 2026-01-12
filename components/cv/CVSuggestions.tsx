/** @format */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Lightbulb,
  TrendingUp,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle2,
  AlertCircle,
  Zap,
  BookOpen,
  Briefcase,
} from "lucide-react";

import { API_BASE_URL } from "@/lib/api";

interface CVSuggestionsProps {
  currentSkills: string[];
  currentExperience: { title: string; company: string }[];
  currentEducation: { degree: string; institution: string }[];
  onAddSkill?: (skill: string) => void;
  accessToken?: string;
}

interface TrendingSkill {
  name: string;
  count: number;
  category: string;
}

interface CVTip {
  id: string;
  type: "warning" | "success" | "info";
  title: string;
  description: string;
  priority: number;
}

// Popular tech skills in 2024 (fallback data)
const POPULAR_SKILLS: TrendingSkill[] = [
  { name: "React", count: 1250, category: "Frontend" },
  { name: "TypeScript", count: 1100, category: "Language" },
  { name: "Node.js", count: 980, category: "Backend" },
  { name: "Python", count: 950, category: "Language" },
  { name: "AWS", count: 890, category: "Cloud" },
  { name: "Docker", count: 850, category: "DevOps" },
  { name: "Kubernetes", count: 720, category: "DevOps" },
  { name: "PostgreSQL", count: 680, category: "Database" },
  { name: "MongoDB", count: 620, category: "Database" },
  { name: "Go", count: 580, category: "Language" },
  { name: "GraphQL", count: 520, category: "API" },
  { name: "Redis", count: 480, category: "Database" },
  { name: "Java", count: 920, category: "Language" },
  { name: "Spring Boot", count: 650, category: "Backend" },
  { name: "Vue.js", count: 540, category: "Frontend" },
  { name: "Angular", count: 510, category: "Frontend" },
  { name: "Next.js", count: 490, category: "Frontend" },
  { name: "Git", count: 1300, category: "Tools" },
  { name: "CI/CD", count: 720, category: "DevOps" },
  { name: "Agile", count: 680, category: "Methodology" },
  { name: "Machine Learning", count: 450, category: "AI/ML" },
  { name: "TensorFlow", count: 380, category: "AI/ML" },
  { name: "REST API", count: 880, category: "API" },
  { name: "SQL", count: 950, category: "Database" },
  { name: "Linux", count: 760, category: "System" },
];

// Skill categories for related suggestions
const SKILL_CATEGORIES: Record<string, string[]> = {
  "Frontend": ["React", "Vue.js", "Angular", "Next.js", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind CSS", "Redux"],
  "Backend": ["Node.js", "Express", "NestJS", "Django", "Flask", "Spring Boot", "FastAPI", "Go", "Rust"],
  "Database": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "DynamoDB", "Oracle"],
  "Cloud": ["AWS", "GCP", "Azure", "Firebase", "Vercel", "Heroku", "DigitalOcean"],
  "DevOps": ["Docker", "Kubernetes", "Jenkins", "GitHub Actions", "GitLab CI", "Terraform", "Ansible"],
  "Mobile": ["React Native", "Flutter", "Swift", "Kotlin", "iOS", "Android"],
  "AI/ML": ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "OpenAI API", "LangChain"],
};

export default function CVSuggestions({
  currentSkills,
  currentExperience,
  currentEducation,
  onAddSkill,
  accessToken,
}: CVSuggestionsProps) {
  const [trendingSkills, setTrendingSkills] = useState<TrendingSkill[]>(POPULAR_SKILLS);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState<"skills" | "tips" | "related">("skills");
  const [isLoading, setIsLoading] = useState(false);

  // Normalize skills for comparison
  const normalizedCurrentSkills = currentSkills.map((s) => s.toLowerCase().trim());

  // Fetch trending skills from job postings
  const fetchTrendingSkills = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/jobs?page=1&pageSize=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const jobs = data.jobs || [];

        // Extract and count skills from job postings
        const skillCounts: Record<string, number> = {};
        jobs.forEach((job: { jobTech?: string[] }) => {
          (job.jobTech || []).forEach((skill: string) => {
            const normalizedSkill = skill.trim();
            if (normalizedSkill) {
              skillCounts[normalizedSkill] = (skillCounts[normalizedSkill] || 0) + 1;
            }
          });
        });

        // Convert to array and sort
        const extractedSkills: TrendingSkill[] = Object.entries(skillCounts)
          .map(([name, count]) => ({
            name,
            count: count * 10, // Scale up for display
            category: getCategoryForSkill(name),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20);

        if (extractedSkills.length > 0) {
          setTrendingSkills(extractedSkills);
        }
      }
    } catch (error) {
      console.error("Failed to fetch trending skills:", error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchTrendingSkills();
  }, [fetchTrendingSkills]);

  // Get category for a skill
  function getCategoryForSkill(skill: string): string {
    const normalizedSkill = skill.toLowerCase();
    for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
      if (skills.some((s) => s.toLowerCase() === normalizedSkill)) {
        return category;
      }
    }
    return "Other";
  }

  // Get missing trending skills
  const missingTrendingSkills = trendingSkills.filter(
    (skill) => !normalizedCurrentSkills.includes(skill.name.toLowerCase())
  );

  // Get related skills based on current skills
  const getRelatedSkills = (): string[] => {
    const relatedSet = new Set<string>();
    
    currentSkills.forEach((skill) => {
      const normalizedSkill = skill.toLowerCase();
      for (const [, categorySkills] of Object.entries(SKILL_CATEGORIES)) {
        if (categorySkills.some((s) => s.toLowerCase() === normalizedSkill)) {
          categorySkills.forEach((s) => {
            if (!normalizedCurrentSkills.includes(s.toLowerCase())) {
              relatedSet.add(s);
            }
          });
        }
      }
    });

    return Array.from(relatedSet).slice(0, 10);
  };

  const relatedSkills = getRelatedSkills();

  // Generate CV tips
  const generateTips = (): CVTip[] => {
    const tips: CVTip[] = [];

    // Check skills
    if (currentSkills.length === 0) {
      tips.push({
        id: "no-skills",
        type: "warning",
        title: "Chưa có kỹ năng",
        description: "Thêm các kỹ năng chuyên môn để nhà tuyển dụng dễ tìm thấy bạn hơn.",
        priority: 1,
      });
    } else if (currentSkills.length < 5) {
      tips.push({
        id: "few-skills",
        type: "info",
        title: "Bổ sung thêm kỹ năng",
        description: `Bạn có ${currentSkills.length} kỹ năng. Nên có ít nhất 5-10 kỹ năng để CV nổi bật hơn.`,
        priority: 2,
      });
    } else {
      tips.push({
        id: "good-skills",
        type: "success",
        title: "Kỹ năng đầy đủ",
        description: `Tuyệt vời! Bạn đã liệt kê ${currentSkills.length} kỹ năng.`,
        priority: 5,
      });
    }

    // Check experience
    if (currentExperience.length === 0 || !currentExperience.some((e) => e.title || e.company)) {
      tips.push({
        id: "no-experience",
        type: "warning",
        title: "Chưa có kinh nghiệm",
        description: "Thêm kinh nghiệm làm việc để CV thuyết phục hơn. Nếu chưa có kinh nghiệm, hãy thêm các dự án cá nhân.",
        priority: 1,
      });
    } else {
      tips.push({
        id: "has-experience",
        type: "success",
        title: "Có kinh nghiệm làm việc",
        description: "Hãy mô tả chi tiết thành tựu và trách nhiệm trong mỗi vị trí.",
        priority: 4,
      });
    }

    // Check education
    if (currentEducation.length === 0 || !currentEducation.some((e) => e.degree || e.institution)) {
      tips.push({
        id: "no-education",
        type: "info",
        title: "Chưa có học vấn",
        description: "Thêm thông tin học vấn hoặc các khóa học đã hoàn thành.",
        priority: 3,
      });
    }

    // Check for trending skills match
    const matchedTrending = trendingSkills.filter((skill) =>
      normalizedCurrentSkills.includes(skill.name.toLowerCase())
    );

    if (matchedTrending.length > 0) {
      tips.push({
        id: "trending-match",
        type: "success",
        title: "Có kỹ năng hot",
        description: `Bạn có ${matchedTrending.length} kỹ năng đang được săn đón: ${matchedTrending.slice(0, 3).map((s) => s.name).join(", ")}${matchedTrending.length > 3 ? "..." : ""}`,
        priority: 3,
      });
    } else if (currentSkills.length > 0) {
      tips.push({
        id: "no-trending",
        type: "info",
        title: "Bổ sung kỹ năng xu hướng",
        description: "Xem xét học thêm các kỹ năng đang được nhiều công ty tìm kiếm.",
        priority: 2,
      });
    }

    return tips.sort((a, b) => a.priority - b.priority);
  };

  const tips = generateTips();

  const handleAddSkill = (skill: string) => {
    if (onAddSkill) {
      onAddSkill(skill);
    }
  };

  const getIconForTipType = (type: CVTip["type"]) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "info":
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold">Đề xuất cải thiện CV</span>
          {!isExpanded && missingTrendingSkills.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {missingTrendingSkills.length} gợi ý
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4">
          {/* Tabs */}
          <div className="flex flex-col gap-1.5 mb-4">
            <button
              onClick={() => setActiveSection("skills")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeSection === "skills"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <TrendingUp className="h-4 w-4 flex-shrink-0" />
              <span>Kỹ năng hot</span>
            </button>
            <button
              onClick={() => setActiveSection("related")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeSection === "related"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Target className="h-4 w-4 flex-shrink-0" />
              <span>Liên quan</span>
            </button>
            <button
              onClick={() => setActiveSection("tips")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeSection === "tips"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Lightbulb className="h-4 w-4 flex-shrink-0" />
              <span>Gợi ý</span>
            </button>
          </div>

          {/* Trending Skills Section */}
          {activeSection === "skills" && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-gray-600">
                  Kỹ năng được nhiều công ty tìm kiếm nhất
                </span>
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {missingTrendingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {missingTrendingSkills.slice(0, 12).map((skill) => (
                    <button
                      key={skill.name}
                      onClick={() => handleAddSkill(skill.name)}
                      className="group flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                      title={`Thêm ${skill.name} vào kỹ năng`}
                    >
                      <span className="text-gray-700 group-hover:text-indigo-700">
                        {skill.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                        {skill.category}
                      </span>
                      <Plus className="h-3.5 w-3.5 text-gray-400 group-hover:text-indigo-600" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">
                    Tuyệt vời! Bạn đã có đầy đủ các kỹ năng hot!
                  </p>
                </div>
              )}

              {/* Your current trending skills */}
              {currentSkills.length > 0 && (
                <div className="mt-4 pt-4 border-t border-indigo-100">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Kỹ năng hot bạn đã có:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {trendingSkills
                      .filter((skill) =>
                        normalizedCurrentSkills.includes(skill.name.toLowerCase())
                      )
                      .slice(0, 8)
                      .map((skill) => (
                        <span
                          key={skill.name}
                          className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md"
                        >
                          {skill.name}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Related Skills Section */}
          {activeSection === "related" && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-600">
                  Kỹ năng liên quan đến chuyên môn của bạn
                </span>
              </div>

              {relatedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {relatedSkills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => handleAddSkill(skill)}
                      className="group flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:border-purple-400 hover:bg-purple-50 transition-all"
                      title={`Thêm ${skill} vào kỹ năng`}
                    >
                      <span className="text-gray-700 group-hover:text-purple-700">
                        {skill}
                      </span>
                      <Plus className="h-3.5 w-3.5 text-gray-400 group-hover:text-purple-600" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Briefcase className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">
                    Thêm một số kỹ năng để nhận gợi ý kỹ năng liên quan
                  </p>
                </div>
              )}

              {/* Skill categories */}
              <div className="mt-4 pt-4 border-t border-purple-100">
                <p className="text-xs text-gray-500 mb-2">Theo danh mục phổ biến:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(SKILL_CATEGORIES).slice(0, 6).map((category) => (
                    <div
                      key={category}
                      className="px-3 py-2 bg-white rounded-lg border border-gray-100"
                    >
                      <p className="text-xs font-medium text-gray-700 mb-1">{category}</p>
                      <p className="text-[10px] text-gray-400">
                        {SKILL_CATEGORIES[category].slice(0, 3).join(", ")}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tips Section */}
          {activeSection === "tips" && (
            <div className="space-y-2">
              {tips.map((tip) => (
                <div
                  key={tip.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    tip.type === "warning"
                      ? "bg-amber-50 border-amber-200"
                      : tip.type === "success"
                      ? "bg-green-50 border-green-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="mt-0.5">{getIconForTipType(tip.type)}</div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        tip.type === "warning"
                          ? "text-amber-800"
                          : tip.type === "success"
                          ? "text-green-800"
                          : "text-blue-800"
                      }`}
                    >
                      {tip.title}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        tip.type === "warning"
                          ? "text-amber-600"
                          : tip.type === "success"
                          ? "text-green-600"
                          : "text-blue-600"
                      }`}
                    >
                      {tip.description}
                    </p>
                  </div>
                </div>
              ))}

              {/* General tips */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2">💡 Mẹo tạo CV nổi bật:</p>
                <ul className="text-xs text-gray-600 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span>Sử dụng các con số cụ thể khi mô tả thành tựu (VD: "Tăng 30% doanh số")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span>Liệt kê kỹ năng theo thứ tự ưu tiên từ mạnh nhất</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span>Mỗi mục kinh nghiệm nên có 3-5 bullet points</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span>Tóm tắt (Summary) nên ngắn gọn 2-3 câu, nêu bật điểm mạnh</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

