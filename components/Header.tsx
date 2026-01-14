'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Briefcase, FileText, PlusCircle, Search, Building2, User, LogOut, ChevronDown, Bell, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUnreadNotificationCount, getNotifications, markNotificationAsRead, markAllNotificationsAsRead, NotificationItem } from '@/lib/api';

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout, accessToken } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Check if user is HR (backend returns uppercase)
  const isHR = user?.role === 'HR' || user?.role === 'hr';

  // Build nav items based on user role
  const navItems = isHR 
    ? [
        { href: '/', label: 'Tìm việc', icon: Search },
        { href: '/companies', label: 'Công ty', icon: Building2 },
        { href: '/post-job', label: 'Đăng tin', icon: PlusCircle },
        { href: '/recruiter', label: 'Quản lý', icon: Users },
      ]
    : [
        { href: '/', label: 'Tìm việc', icon: Search },
        { href: '/companies', label: 'Công ty', icon: Building2 },
        { href: '/post-job', label: 'Đăng tin', icon: PlusCircle },
        { href: '/cv', label: 'CV của tôi', icon: FileText },
      ];

  // Fetch unread count
  useEffect(() => {
    if (accessToken && isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [accessToken, isAuthenticated]);

  const fetchUnreadCount = async () => {
    if (!accessToken) return;
    try {
      const count = await getUnreadNotificationCount(accessToken);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    if (!accessToken) return;
    setIsLoadingNotifications(true);
    try {
      const data = await getNotifications(accessToken, 1, 10);
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!accessToken) return;
    try {
      await markNotificationAsRead(notificationId, accessToken);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!accessToken) return;
    try {
      await markAllNotificationsAsRead(accessToken);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationLink = (notification: NotificationItem): string => {
    // For HR: new applications go to recruiter page
    if (notification.type === 'new_application' && notification.objectId) {
      return '/recruiter';
    }
    // For job-related notifications with objectId, go to job detail
    if (notification.type === 'application_status' && notification.objectId) {
      return `/jobs/${notification.objectId}`;
    }
    // All other notifications (including CV/resume related) go to CV page
    return '/cv';
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <Briefcase className="h-8 w-8 text-blue-600 relative" />
            </div>
            <span className="text-2xl font-display font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">JobFind</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={handleOpenNotifications}
                    className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowNotifications(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                          <h3 className="font-semibold text-gray-900">Thông báo</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Đánh dấu đã đọc
                            </button>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {isLoadingNotifications ? (
                            <div className="flex justify-center py-8">
                              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">
                              Chưa có thông báo nào
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <Link
                                key={notification.id}
                                href={getNotificationLink(notification)}
                                onClick={() => {
                                  if (!notification.isRead) {
                                    handleMarkAsRead(notification.id);
                                  }
                                  setShowNotifications(false);
                                }}
                                className={`block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                                  !notification.isRead ? 'bg-blue-50/50' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                    notification.isRead ? 'bg-gray-300' : 'bg-blue-500'
                                  }`}></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.content}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(notification.createdAt).toLocaleDateString('vi-VN', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {user.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                      {user.fullName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>

                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>Hồ sơ của tôi</span>
                      </Link>
                      <Link
                        href="/cv"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        <span>CV của tôi</span>
                      </Link>
                      {isHR && (
                        <Link
                          href="/recruiter"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Users className="h-4 w-4" />
                          <span>Quản lý tuyển dụng</span>
                        </Link>
                      )}
                      <hr className="my-2 border-gray-100" />
                      <button
                        onClick={() => {
                          logout();
                          setShowDropdown(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </>
                )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 text-sm font-medium transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all"
                >
                  <span className="relative z-10">Đăng ký</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex justify-around border-t border-gray-200 py-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-md text-xs font-medium ${
                  isActive ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
