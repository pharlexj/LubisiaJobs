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
  X,
  DollarSign,
  Receipt,
  BookOpen,
  TrendingUp,
  Calculator,
  ChevronDown,
  ChevronRight,
  Building,
  Edit
} from 'lucide-react';
import ProfileCompletion from '@/components/applicant/ProfileCompletion';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ProfileSettingsDrawer from '@/components/common/ProfileSettingsDrawer';
import { Description } from '@radix-ui/react-toast';

interface SidebarProps {
  userRole: 'applicant' | 'admin' | 'board' | 'accountant' | 'a.i.e Holder' | 'recordsOfficer' | 'boardSecretary' | 'chiefOfficer' | 'boardChair' | 'boardCommittee' | 'HR';
}

export default function Sidebar({ userRole }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(true); // desktop expand/collapse
  const [isMobileOpen, setIsMobileOpen] = useState(false); // mobile slide
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

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
    {
      id: "board",
      label:'Recruitment',
      icon: Building,
      description: "Recruitment Processes",
      children: [
        { href: '/board/shortlisting', icon: CheckCircle, label: 'Shortlisting', description: 'Review & shortlist' },
        { href: '/board/schedule', icon: Calendar, label: 'Schedule', description: 'Schedule for Interviews' },
        { href: '/board/interviews', icon: Calendar, label: 'Interviews', description: 'Schedule & conduct' },
        { href: '/board/scoring', icon: Award, label: 'Scoring', description: 'Interview assessment' },
        { href: '/board/hiring', icon: Users, label: 'Hiring', description: 'Award jobs to candidates' },
        { href: '/board/reports', icon: BarChart3, label: 'Reports', description: 'Selection reports' },        
      ]
    },
    {
      id: 'board_committee',
      label: 'Committee',
      icon: Edit,
      description: 'Committe Documents',
      children: [
        { href: '/rms/board-committee', icon: LayoutDashboard, label: 'Dashboard', description: 'Committee review & documents' },
      ]
    }
  ];

  const accountNavItems = [
    { href: '/accountant', icon: LayoutDashboard, label: 'Dashboard', description: 'Accountant overview' },
    { 
      id: 'transactions',
      icon: DollarSign, 
      label: 'Transactions', 
      description: 'Financial transactions',
      children: [
        { href: '/accountant/claims', icon: Receipt, label: 'Claims', description: 'Process claims' },
        { href: '/accountant/payments', icon: DollarSign, label: 'Payments', description: 'Payment processing' },
        { href: '/accountant/mir', icon: BookOpen, label: 'Master Imprest', description: 'MIR management' },
      ]
    },
    { 
      id: 'reporting',
      icon: TrendingUp, 
      label: 'Reporting', 
      description: 'Financial reports',
      children: [
        { href: '/accountant/reports', icon: FileText, label: 'Reports', description: 'Financial reports' },
        { href: '/accountant/charts', icon: BarChart3, label: 'Charts', description: 'Analytics & charts' },
      ]
    },
    { 
      id: 'setup',
      icon: Settings, 
      label: 'Accounts Setup', 
      description: 'System configuration',
      children: [
        { href: '/accountant/vote', icon: Calculator, label: 'Vote Management', description: 'Manage votes' },
        { href: '/accountant/budget', icon: Briefcase, label: 'Budget', description: 'Budget planning' },
        { href: '/accountant/employees', icon: Users, label: 'Employees', description: 'Employee records' },
        { href: '/accountant/settings', icon: Settings, label: 'Settings', description: 'System settings' },
      ]
    },
  ];

  const aieNavItems = [
    { href: '/aie', icon: LayoutDashboard, label: 'Dashboard', description: 'A.I.E overview' },
    { 
      id: 'transactions',
      icon: DollarSign, 
      label: 'Transactions', 
      description: 'Financial transactions',
      children: [
        { href: '/aie/requests', icon: CheckCircle, label: 'Requests', description: 'Approval requests' },
        { href: '/aie/mir', icon: BookOpen, label: 'Master Imprest', description: 'MIR overview' },
        { href: '/aie/budget', icon: Briefcase, label: 'Budget', description: 'Budget overview' },
        { href: '/aie/vote', icon: Calculator, label: 'Vote', description: 'Vote overview' },
      ]
    },
    { 
      id: 'reporting',
      icon: TrendingUp, 
      label: 'Reports', 
      description: 'Financial reports',
      children: [
        { href: '/aie/reports', icon: FileText, label: 'Reports', description: 'Financial reports' },
        { href: '/aie/charts', icon: BarChart3, label: 'Charts', description: 'Analytics & charts' },
      ]
    },
  ];

  const recordsOfficerNavItems = [
    { href: '/rms/records-officer', icon: LayoutDashboard, label: 'Dashboard', description: 'Doc. registry & overview' },
  ];

  const boardSecretaryNavItems = [
    { href: '/rms/board-secretary', icon: LayoutDashboard, label: 'Dashboard', description: 'Doc. review & overview' },
  ];

  const boardChairNavItems = [
    { href: '/rms/board-chair', icon: LayoutDashboard, label: 'Dashboard', description: 'Doc. review & remarks' },
  ];

  const chiefOfficerNavItems = [
    { href: '/rms/chief-officer', icon: LayoutDashboard, label: 'Dashboard', description: 'Decision oversight & review' },
  ];

  const boardCommitteeNavItems = [
    { href: '/rms/board-committee', icon: LayoutDashboard, label: 'Dashboard', description: 'Committee review' },
  ];

  const hrNavItems = [
    { href: '/rms/hr', icon: LayoutDashboard, label: 'Dashboard', description: 'Agenda management & filing' },
  ];

  const getNavItems = () => {
    switch (userRole) {
      case 'applicant': return applicantNavItems;
      case 'admin': return adminNavItems;
      case 'board': return boardNavItems;
      case 'accountant': return accountNavItems;
      case 'a.i.e Holder': return aieNavItems;
      case 'recordsOfficer': return recordsOfficerNavItems;
      case 'boardSecretary': return boardSecretaryNavItems;
      case 'boardChair': return boardChairNavItems;
      case 'chiefOfficer': return chiefOfficerNavItems;
      case 'boardCommittee': return boardCommitteeNavItems;
      case 'HR': return hrNavItems;
      default: return [];
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'applicant': return 'bg-blue-100 text-blue-800';
      case 'admin': return 'bg-red-700 text-yellow-300';
      case 'board': return 'bg-green-900 text-green-100';
      case 'accountant': return 'bg-yellow-800 text-yellow-100';
      case 'a.i.e Holder': return 'bg-purple-100 text-purple-800';
      case 'boardChair': return 'bg-black-100 text-black-800';
      case 'boardSecretary': return 'bg-yellow-100 text-yellow-800';
      case 'recordsOfficer': return 'Records Officer';
      case 'chiefOfficer': return 'bg-green-100 text-green-800';
      case 'boardCommittee': return 'bg-red-100 text-red-800';
      case 'HR': return 'HR Officer';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'applicant': return 'Applicant';
      case 'admin': return 'Administrator';
      case 'board': return 'Board Member';
      case 'accountant': return 'Accountant';
      case 'a.i.e Holder': return 'A.I.E Holder';
      case 'boardChair': return 'Board Chair';
      case 'boardSecretary': return 'Board Secretary';
      case 'recordsOfficer': return 'Records Officer';
      case 'chiefOfficer': return 'Chief Officer';
      case 'boardCommittee': return 'Board Committee';
      case 'HR': return 'HR Officer';
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
            {getNavItems().map((item: any) => {
              const IconComponent = item.icon;
              const isActive = location === item.href;
              const isGroupExpanded = item.id && expandedGroups.includes(item.id);
              const hasChildren = item.children && item.children.length > 0;

              // Regular nav item (no children)
              if (!hasChildren) {
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
              }

              // Expandable group item
              return (
                <div key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => toggleGroup(item.id)}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                          isGroupExpanded
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-5 h-5 shrink-0" />
                          {isOpen && (
                            <div className="flex-1 min-w-0 text-left">
                              <div className="font-medium text-sm">{item.label}</div>
                              <div className="text-xs opacity-75 truncate">{item.description}</div>
                            </div>
                          )}
                        </div>
                        {isOpen && (
                          isGroupExpanded ? (
                            <ChevronDown className="w-4 h-4 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 shrink-0" />
                          )
                        )}
                      </button>
                    </TooltipTrigger>
                    {!isOpen && <TooltipContent side="right">{item.label}</TooltipContent>}
                  </Tooltip>

                  {/* Children (sub-items) */}
                  {isOpen && isGroupExpanded && (
                    <div className="ml-7 mt-1 space-y-1">
                      {item.children.map((child: any) => {
                        const ChildIcon = child.icon;
                        const isChildActive = location === child.href;

                        return (
                          <Link key={child.href} href={child.href}>
                            <a
                              onClick={() => setIsMobileOpen(false)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                                isChildActive
                                  ? 'bg-blue-50 text-primary border border-blue-200'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <ChildIcon className="w-4 h-4 shrink-0" />
                              <span>{child.label}</span>
                            </a>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
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
