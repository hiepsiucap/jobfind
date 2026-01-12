'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Sparkles, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

interface ParsedCVData {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  education: {
    degree: string;
    institution: string;
    graduation_year: string;
    description?: string;
  }[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description?: string;
    responsibilities: string[];
    achievements: string[];
  }[];
  projects?: {
    name: string;
    description: string;
    url?: string;
    technologies: string[];
    duration?: string;
    role?: string;
    achievements?: string[];
  }[];
  certifications: string[];
  languages: string[];
  achievements?: string[];
}

interface CVUploadProps {
  onUpload: (file: File) => void;
  onParse: (data?: ParsedCVData) => void;
  onSuccess?: () => void;
}

export default function CVUpload({ onUpload, onParse, onSuccess }: CVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const uploadedFile = acceptedFiles[0];
        setFile(uploadedFile);
        setError(null);
        setSuccess(null);
        onUpload(uploadedFile);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleParse = async () => {
    if (!file) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Vui lòng đăng nhập để parse CV');
      return;
    }

    setIsParsing(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use sync upload endpoint for simpler flow
      const response = await fetch(`${API_BASE_URL}/api/v1/resumes/upload/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Backend returned plain text error
        const text = await response.text();
        if (!response.ok) {
          throw new Error(text || `Lỗi: ${response.status}`);
        }
        // Try to parse as JSON anyway if response is ok
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(text || 'Response không hợp lệ');
        }
      }

      if (!response.ok) {
        // Handle specific error messages from BE
        const errorMessage = data.message || data.error || data.detail || `Lỗi: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      if (data.success) {
        setSuccess('Parse CV thành công! CV đã được lưu.');
        setFile(null);
        onParse(data.cv_data);
        onSuccess?.();
        toast.success('Parse CV thành công! CV đã được lưu.');
      } else {
        throw new Error(data.message || 'Parse CV thất bại');
      }
    } catch (err) {
      console.error('CV parsing error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Không thể parse CV. Vui lòng thử lại.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsParsing(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Upload CV mới</h2>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 text-sm">Lỗi</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-800 text-sm">Thành công</p>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
            <Upload className="h-8 w-8 text-purple-600" />
          </div>
          {isDragActive ? (
            <p className="text-lg text-purple-600 font-medium">Thả file CV tại đây...</p>
          ) : (
            <div>
              <p className="text-gray-700 font-medium mb-1">
                Kéo thả CV hoặc click để chọn
              </p>
              <p className="text-sm text-gray-500">
                File <span className="font-semibold text-purple-600">PDF</span> (Tối đa 10MB)
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {!isParsing && (
                <button
                  onClick={handleRemove}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleParse}
            disabled={isParsing}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isParsing ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Đang parse CV với AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Parse & Lưu CV</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-lg">
        <div className="flex items-start gap-2">
          <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-gray-900 mb-1">AI-Powered CV Parsing</p>
            <p className="text-gray-600">
              AI sẽ tự động trích xuất thông tin từ CV và lưu vào hệ thống.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
