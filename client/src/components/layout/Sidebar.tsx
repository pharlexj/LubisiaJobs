import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  User,
  FileText,
  Search,
  Upload,
  Settings,
  Briefcase,
  Users,
  BarChart3,
  Bell,
  CheckCircle,
  Calendar,
  Award,
  LogOut,
  MessageCircle,
  Menu,
  X
} from 'lucide-react';
import ProfileCompletion from '@/components/applicant/ProfileCompletion';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ProfileSettingsDrawer from '@/components/common/ProfileSettingsDrawer';

interface SidebarProps {
  userRole: 'applicant' | 'admin' | 'board' | 'accountant' | 'a.i.e Holder';
}

export default function Sidebar({ userRole }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(true); // desktop expand/collapse
  const [isMobileOpen, setIsMobileOpen] = useState(false); // mobile slide
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const getUserInitials = () => {
    if (!user?.firstName && !user?.lastName) return 'U';
    return `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
  };

  // Navigation arrays
  const applicantNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview and stats' },
    { href: '/profile', icon: User, label: 'Profile', description: 'Complete your profile' },
    { href: '/applications', icon: FileText, label: 'My Applications', description: 'Track applications' },
    { href: '/jobs', icon: Search, label: 'Browse Jobs', description: 'Find opportunities' },
    { href: '/documents', icon: Upload, label: 'Documents', description: 'Upload certificates' },
  ];

  const adminNavItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', description: 'Admin overview' },
    { href: '/admin/jobs', icon: Briefcase, label: 'Job Management', description: 'Create & manage jobs' },
    { href: '/admin/applications', icon: Users, label: 'Applications', description: 'Review applications' },
    { href: '/admin/reports', icon: BarChart3, label: 'Reports', description: 'Generate reports' },
    { href: '/admin/notifications', icon: Bell, label: 'Notifications', description: 'Send notifications' },
    { href: '/admin/sms', icon: MessageCircle, label: 'SMS Communications', description: 'Send SMS messages' },
    { href: '/admin/settings', icon: Settings, label: 'System Config', description: 'System settings' },
  ];

  const boardNavItems = [
    { href: '/board', icon: LayoutDashboard, label: 'Dashboard', description: 'Committee overview' },
    { href: '/board/shortlisting', icon: CheckCircle, label: 'Shortlisting', description: 'Review & shortlist' },
    { href: '/board/schedule', icon: Calendar, label: 'Schedule', description: 'Schedule for Interviews' },
    { href: '/board/interviews', icon: Calendar, label: 'Interviews', description: 'Schedule & conduct' },
    { href: '/board/scoring', icon: Award, label: 'Scoring', description: 'Interview assessment' },
    { href: '/board/reports', icon: BarChart3, label: 'Reports', description: 'Selection reports' },
  ];

  const accountNavItems = [
    { href: '/accounts/reports', icon: BarChart3, label: 'Claim', description: 'Selection reports' },
    { href: '/accounts/payment', icon: BarChart3, label: 'Payment', description: 'Voucher Payment' },
    { href: '/accounts/MIR', icon: BarChart3, label: 'MIR', description: 'Register Management' },
    { href: '/accounts/budget', icon: BarChart3, label: 'Budget', description: 'Budget Management' },
    { href: '/accounts/votes', icon: BarChart3, label: 'Vote', description: 'Votes Management' },
  ];

  const getNavItems = () => {
    switch (userRole) {
      case 'applicant': return applicantNavItems;
      case 'admin': return adminNavItems;
      case 'board': return boardNavItems;
      case 'accountant': return accountNavItems;
      default: return [];
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'applicant': return 'bg-blue-100 text-blue-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'board': return 'bg-green-100 text-green-800';
      case 'accountant': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'applicant': return 'Applicant';
      case 'admin': return 'Administrator';
      case 'board': return 'Board Member';
      case 'accountant': return 'Accountant';
      default: return 'User';
    }
  };

  const sidebarWidth = isOpen ? 'w-64' : 'w-20';

  // -------------------- RENDER -------------------- //
  return (
    <>
      {/* 🔹 Mobile Toggle Button (visible on small screens) */}
      <div className="fixed top-3 left-3 z-50 md:hidden">
        <Button variant="outline" size="icon" className="bg-white shadow-md" onClick={toggleMobileSidebar}>
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full bg-white border-r border-gray-200 shadow-sm flex flex-col z-40 transform transition-all duration-300 ease-in-out ${sidebarWidth}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      >
        {/* Profile Header */}
        <div className="relative p-4 border-b border-gray-200 flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImageUrl} alt={user?.firstName} />
            <AvatarFallback className="bg-primary text-white">{getUserInitials()}</AvatarFallback>
          </Avatar>

          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {(user?.firstName || '').toUpperCase()} {user?.lastName || ''}
              </p>
              <p className="text-sm text-gray-600 truncate">{user?.email}</p>
              <Badge className={`${getRoleColor()} mt-1`}>{getRoleLabel()}</Badge>
            </div>
          )}

          {/* Desktop collapse toggle button (top-right corner of sidebar) */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 text-gray-600 hover:text-gray-900 hidden md:flex"
            onClick={toggleSidebar}
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <TooltipProvider delayDuration={200}>
            {getNavItems().map((item) => {
              const IconComponent = item.icon;
              const isActive = location === item.href;

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <a
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                          isActive
                            ? 'bg-blue-50 text-primary border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <IconComponent className="w-5 h-5 shrink-0" />
                        {isOpen && (
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{item.label}</div>
                            <div className="text-xs opacity-75 truncate">{item.description}</div>
                          </div>
                        )}
                      </a>
                    </Link>
                  </TooltipTrigger>
                  {!isOpen && <TooltipContent side="right">{item.label}</TooltipContent>}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {isOpen && (
            <>
              <Separator className="mb-4" />
              {userRole === 'applicant' && <ProfileCompletion />}
              <Button
                variant="outline"
                className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50 mb-2"
                onClick={() => setShowProfileSettings(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </Button>
            </>
          )}

          <ProfileSettingsDrawer
            open={showProfileSettings}
            onClose={() => setShowProfileSettings(false)}
            user={user}
          />

          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isOpen && 'Sign Out'}
          </Button>
        </div>
      </aside>

      {/* 🔹 Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={toggleMobileSidebar} />
      )}
    </>
  );
}
