'use client';

import { FileText, Upload, Sparkles } from 'lucide-react';

export type CVTab = 'view' | 'upload' | 'generate';

const tabs = [
  {
    id: 'view' as const,
    label: 'CV của tôi',
    icon: FileText,
    description: 'Xem và tải CV',
  },
  {
    id: 'upload' as const,
    label: 'Upload',
    icon: Upload,
    description: 'Parse từ file',
  },
  {
    id: 'generate' as const,
    label: 'Tạo mới',
    icon: Sparkles,
    description: 'Tạo với AI',
  },
];

interface CVSidebarProps {
  activeTab: CVTab | null;
  onTabChange: (tab: CVTab) => void;
}

const CVSidebar = ({ activeTab, onTabChange }: CVSidebarProps) => {
  return (
    <div className="w-56 bg-white border-r border-gray-200 flex flex-col py-4 px-3 shrink-0">
      {/* Logo/Title */}
      <div className="flex items-center gap-2 px-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-gray-900">CV Builder</span>
      </div>

      {/* Navigation Tabs */}
      <nav className="space-y-1 flex-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`}
              />
              <div>
                <div
                  className={`text-sm font-semibold ${
                    isActive ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {tab.label}
                </div>
                <div
                  className={`text-xs ${
                    isActive ? 'text-white/70' : 'text-gray-500'
                  }`}
                >
                  {tab.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom Stats */}
      <div className="border-t border-gray-100 pt-4 mt-4">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-2">Thống kê</div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">50K+</div>
              <div className="text-[10px] text-gray-500">CV tạo</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">95%</div>
              <div className="text-[10px] text-gray-500">Thành công</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVSidebar;










