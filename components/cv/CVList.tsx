'use client';

import { FileText, Edit, Trash2, Eye, Download, Clock, MoreVertical } from 'lucide-react';
import { useState } from 'react';

interface ResumeDetail {
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
}

export interface CVListItem {
  id: string;
  resumeDetail?: ResumeDetail;
  version?: number;
  createdAt: string;
}

interface CVListProps {
  cvs: CVListItem[];
  selectedId?: string;
  onSelect: (cv: CVListItem) => void;
  onEdit: (cv: CVListItem) => void;
  onDelete: (cv: CVListItem) => void;
  isDeleting?: string | null;
}

const CVList = ({
  cvs,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  isDeleting,
}: CVListProps) => {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  if (cvs.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có CV nào</h3>
        <p className="text-gray-500 text-sm">
          Tạo CV mới hoặc upload CV có sẵn để bắt đầu
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">
          {cvs.length} CV của bạn
        </h3>
      </div>

      {cvs.map((cv) => {
        const name = cv.resumeDetail?.name || 'CV chưa có tên';
        const email = cv.resumeDetail?.email || '';
        const isSelected = cv.id === selectedId;
        const isCurrentDeleting = isDeleting === cv.id;

        return (
          <div
            key={cv.id}
            className={`relative bg-white rounded-lg border-2 p-4 transition-all cursor-pointer group ${
              isSelected
                ? 'border-blue-500 shadow-md ring-2 ring-blue-100'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
            } ${isCurrentDeleting ? 'opacity-50' : ''}`}
            onClick={() => onSelect(cv)}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}
              >
                <FileText
                  className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-gray-500'}`}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{name}</h4>
                {email && (
                  <p className="text-sm text-gray-500 truncate">{email}</p>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(cv.createdAt)}</span>
                  {cv.version && cv.version > 1 && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                      v{cv.version}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === cv.id ? null : cv.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {/* Dropdown Menu */}
                {menuOpen === cv.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(null);
                      }}
                    />
                    <div className="absolute right-0 top-8 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(cv);
                          setMenuOpen(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Xem chi tiết
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(cv);
                          setMenuOpen(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Download functionality placeholder
                          setMenuOpen(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Tải PDF
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(cv);
                          setMenuOpen(null);
                        }}
                        disabled={isCurrentDeleting}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {isCurrentDeleting ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute -left-0.5 top-3 bottom-3 w-1 bg-blue-500 rounded-r" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CVList;














