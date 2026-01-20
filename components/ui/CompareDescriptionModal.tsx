'use client';

import { useEffect, useRef } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';

interface CompareDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  oldContent: string;
  newContent: string;
  confirmText?: string;
  cancelText?: string;
}

export function CompareDescriptionModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'So sánh nội dung',
  oldContent,
  newContent,
  confirmText = 'Áp dụng',
  cancelText = 'Hủy',
}: CompareDescriptionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Old Content */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    Nội dung hiện tại
                  </span>
                </div>
                <div className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {oldContent || <span className="text-gray-400 italic">Không có nội dung</span>}
                  </p>
                </div>
              </div>

              {/* Arrow (hidden on mobile) */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-4 z-10">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* New Content */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Nội dung từ AI
                  </span>
                </div>
                <div className="flex-1 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {newContent || <span className="text-gray-400 italic">Không có nội dung</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-gray-50">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}






