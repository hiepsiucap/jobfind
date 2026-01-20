/** @format */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  FileText,
  Code,
  ArrowRight,
  ChevronRight,
  Loader2,
  Wifi,
  Building,
  Globe,
} from "lucide-react";
import {
  createJob,
  updateJob,
  fetchCompanies,
  fetchBackendJobById,
  Company,
} from "@/lib/api";
import { toast } from "sonner";

function PostJobContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editJobId = searchParams?.get("edit");
  const isEditMode = !!editJobId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingJob, setIsLoadingJob] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  const [formData, setFormData] = useState({
    companyId: "",
    title: "",
    location: "",
    workMode: "ONSITE", // ONSITE, REMOTE, HYBRID
    jobType: "FULL_TIME",
    level: "MID",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "VND",
    experienceRequirement: "",
    description: "",
    responsibilities: "",
    requirements: "",
    benefits: "",
    jobTech: "",
  });

  useEffect(() => {
    async function loadCompanies() {
      try {
        const data = await fetchCompanies({ pageSize: 100 });
        setCompanies(data.companies || []);
      } catch (err) {
        console.error("Failed to load companies:", err);
      } finally {
        setIsLoadingCompanies(false);
      }
    }
    loadCompanies();
  }, []);

  // Load job data when in edit mode
  useEffect(() => {
    async function loadJob() {
      if (!editJobId) return;

      setIsLoadingJob(true);
      try {
        const job = await fetchBackendJobById(editJobId);
        if (job) {
          // Parse location to extract work mode
          let workMode = "ONSITE";
          let location = job.location;
          if (job.location?.includes("(Remote)")) {
            workMode = "REMOTE";
            location = job.location.replace("(Remote)", "").trim();
          } else if (job.location?.includes("(Hybrid)")) {
            workMode = "HYBRID";
            location = job.location.replace("(Hybrid)", "").trim();
          }

          setFormData({
            companyId: job.companyId || "",
            title: job.title || "",
            location: location || "",
            workMode,
            jobType: job.jobType || "FULL_TIME",
            level: job.level || "MID",
            salaryMin: job.salaryMin ? job.salaryMin.toString() : "",
            salaryMax: job.salaryMax ? job.salaryMax.toString() : "",
            salaryCurrency: job.salaryCurrency || "VND",
            experienceRequirement: job.experienceRequirement || "",
            description: job.description || "",
            responsibilities: job.responsibilities || "",
            requirements: job.requirements || "",
            benefits: job.benefits || "",
            jobTech: (job.jobTech || []).join(", "),
          });
        }
      } catch (err) {
        console.error("Failed to load job:", err);
        toast.error("Không thể tải thông tin tin tuyển dụng");
        router.push("/post-job");
      } finally {
        setIsLoadingJob(false);
      }
    }
    loadJob();
  }, [editJobId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Vui lòng đăng nhập để đăng tin tuyển dụng");
      setIsSubmitting(false);
      return;
    }

    try {
      const jobTech = formData.jobTech
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Build location string with work mode
      let locationString = formData.location;
      if (formData.workMode === "REMOTE") {
        locationString = formData.location
          ? `${formData.location} (Remote)`
          : "Remote";
      } else if (formData.workMode === "HYBRID") {
        locationString = formData.location
          ? `${formData.location} (Hybrid)`
          : "Hybrid";
      }

      const jobData: any = {
        title: formData.title,
        level: formData.level,
        jobType: formData.jobType,
        location: locationString,
        description: formData.description,
        jobTech: jobTech,
        active: true,
      };

      // Add optional fields only if they have values
      if (formData.companyId) jobData.companyId = formData.companyId;
      if (formData.salaryMin)
        jobData.salaryMin = parseFloat(formData.salaryMin);
      if (formData.salaryMax)
        jobData.salaryMax = parseFloat(formData.salaryMax);
      if (formData.salaryCurrency)
        jobData.salaryCurrency = formData.salaryCurrency;
      if (formData.experienceRequirement)
        jobData.experienceRequirement = formData.experienceRequirement;
      if (formData.responsibilities)
        jobData.responsibilities = formData.responsibilities;
      if (formData.requirements) jobData.requirements = formData.requirements;
      if (formData.benefits) jobData.benefits = formData.benefits;

      if (isEditMode && editJobId) {
        console.log("[PostJob] Updating job:", editJobId, jobData);
        const result = await updateJob(editJobId, jobData, token);
        console.log("[PostJob] Update result:", result);
        toast.success("Cập nhật tin thành công!");
        router.push("/recruiter");
      } else {
        console.log("[PostJob] Creating job:", jobData);
        await createJob(jobData, token);
        toast.success("Đăng tin thành công!");
        router.push("/jobs");
      }
    } catch (err) {
      console.error("[PostJob] Error:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Không thể đăng tin";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoadingJob) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header - Compact */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEditMode ? "Cập Nhật Tin Tuyển Dụng" : "Đăng Tin Tuyển Dụng"}
            </h1>
            <p className="text-sm text-gray-500">
              Tìm ứng viên phù hợp cho công ty
            </p>
          </div>
        </div>

        {/* Form - Two Column Layout */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Company & Basic Info Section */}
              <div className="bg-purple-50/50 rounded-lg p-3 border border-purple-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">
                    1
                  </span>
                  Thông tin cơ bản
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Công ty *
                    </label>
                    <select
                      name="companyId"
                      value={formData.companyId}
                      onChange={handleChange}
                      required
                      disabled={isLoadingCompanies}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-100 outline-none bg-white disabled:bg-gray-100"
                    >
                      <option value="">
                        {isLoadingCompanies
                          ? "Đang tải..."
                          : "-- Chọn công ty --"}
                      </option>
                      {companies.map((company) => (
                        <option
                          key={company.id}
                          value={company.id}
                        >
                          {company.name}
                        </option>
                      ))}
                    </select>
                    <a
                      href="/companies/create"
                      className="text-xs text-purple-600 hover:underline mt-1 inline-block"
                    >
                      + Tạo công ty mới
                    </a>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Tiêu đề *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="VD: Senior Backend Engineer"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-100 outline-none"
                    />
                  </div>

                  {/* Work Mode Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Hình thức làm việc *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, workMode: "ONSITE" })
                        }
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all text-xs font-medium ${
                          formData.workMode === "ONSITE"
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                        }`}
                      >
                        <Building className="h-3.5 w-3.5" />
                        <span>Onsite</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, workMode: "REMOTE" })
                        }
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all text-xs font-medium ${
                          formData.workMode === "REMOTE"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                        }`}
                      >
                        <Wifi className="h-3.5 w-3.5" />
                        <span>Remote</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, workMode: "HYBRID" })
                        }
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all text-xs font-medium ${
                          formData.workMode === "HYBRID"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                        }`}
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>Hybrid</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {formData.workMode === "REMOTE"
                          ? "Địa điểm (tùy chọn)"
                          : "Địa điểm *"}
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required={formData.workMode !== "REMOTE"}
                        placeholder={
                          formData.workMode === "REMOTE"
                            ? "VD: Việt Nam"
                            : "VD: Hồ Chí Minh"
                        }
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Kinh nghiệm
                      </label>
                      <input
                        type="text"
                        name="experienceRequirement"
                        value={formData.experienceRequirement}
                        onChange={handleChange}
                        placeholder="VD: 3-5 năm"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-100 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Loại hình
                      </label>
                      <select
                        name="jobType"
                        value={formData.jobType}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-100 outline-none bg-white"
                      >
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="INTERNSHIP">Internship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Cấp bậc
                      </label>
                      <select
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-100 outline-none bg-white"
                      >
                        <option value="ENTRY">Entry Level</option>
                        <option value="JUNIOR">Junior</option>
                        <option value="MID">Mid Level</option>
                        <option value="SENIOR">Senior</option>
                        <option value="LEAD">Lead</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary Section */}
              <div className="bg-green-50/50 rounded-lg p-3 border border-green-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">
                    2
                  </span>
                  Mức lương
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Tối thiểu
                    </label>
                    <input
                      type="number"
                      name="salaryMin"
                      value={formData.salaryMin}
                      onChange={handleChange}
                      placeholder="15000000"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Tối đa
                    </label>
                    <input
                      type="number"
                      name="salaryMax"
                      value={formData.salaryMax}
                      onChange={handleChange}
                      placeholder="30000000"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Tiền tệ
                    </label>
                    <select
                      name="salaryCurrency"
                      value={formData.salaryCurrency}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-100 outline-none bg-white"
                    >
                      <option value="VND">VND</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="bg-orange-50/50 rounded-lg p-3 border border-orange-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs">
                    3
                  </span>
                  Tech Stack
                </h3>

                <input
                  type="text"
                  name="jobTech"
                  value={formData.jobTech}
                  onChange={handleChange}
                  placeholder="Go, PostgreSQL, Redis, Docker, Kubernetes"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-100 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Phân cách bằng dấu phẩy
                </p>
              </div>
            </div>

            {/* Right Column - Descriptions */}
            <div className="space-y-4">
              <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                    4
                  </span>
                  Chi tiết công việc
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Mô tả công việc *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="Mô tả vai trò và những gì bạn đang tìm kiếm..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Trách nhiệm
                    </label>
                    <textarea
                      name="responsibilities"
                      value={formData.responsibilities}
                      onChange={handleChange}
                      rows={3}
                      placeholder="• Thiết kế và phát triển API&#10;• Code review&#10;• Mentor junior developers"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Yêu cầu
                    </label>
                    <textarea
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleChange}
                      rows={3}
                      placeholder="• 5+ năm kinh nghiệm&#10;• Thành thạo Go/Python&#10;• Kinh nghiệm microservices"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Phúc lợi
                    </label>
                    <textarea
                      name="benefits"
                      value={formData.benefits}
                      onChange={handleChange}
                      rows={3}
                      placeholder="• Lương cạnh tranh&#10;• Bảo hiểm sức khỏe&#10;• Remote work"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang đăng...</span>
                </>
              ) : (
                <>
                  <span>{isEditMode ? "Cập nhật" : "Đăng tin"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PostJobPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Đang tải...</p>
          </div>
        </div>
      }
    >
      <PostJobContent />
    </Suspense>
  );
}
