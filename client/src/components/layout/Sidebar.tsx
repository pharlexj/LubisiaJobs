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
  MessageCircle
} from 'lucide-react';
import ProfileCompletion from '@/components/applicant/ProfileCompletion';

interface SidebarProps {
  userRole: 'applicant' | 'admin' | 'board' |'accountant'| 'a.i.e Holder';
}

export default function Sidebar({ userRole }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const getUserInitials = () => {
    if (!user?.firstName && !user?.lastName) return 'U';
    return `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const applicantNavItems = [
    { 
      href: '/dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      description: 'Overview and stats' 
    },
    { 
      href: '/profile', 
      icon: User, 
      label: 'Profile', 
      description: 'Complete your profile' 
    },
    { 
      href: '/applications', 
      icon: FileText, 
      label: 'My Applications', 
      description: 'Track applications' 
    },
    { 
      href: '/jobs', 
      icon: Search, 
      label: 'Browse Jobs', 
      description: 'Find opportunities' 
    },
    { 
      href: '/documents', 
      icon: Upload, 
      label: 'Documents', 
      description: 'Upload certificates' 
    },
  ];

  const adminNavItems = [
    { 
      href: '/admin', 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      description: 'Admin overview' 
    },
    { 
      href: '/admin/jobs', 
      icon: Briefcase, 
      label: 'Job Management', 
      description: 'Create & manage jobs' 
    },
    { 
      href: '/admin/applications', 
      icon: Users, 
      label: 'Applications', 
      description: 'Review applications' 
    },
    { 
      href: '/admin/reports', 
      icon: BarChart3, 
      label: 'Reports', 
      description: 'Generate reports' 
    },
    { 
      href: '/admin/notifications', 
      icon: Bell, 
      label: 'Notifications', 
      description: 'Send notifications' 
    },
    { 
      href: '/admin/sms', 
      icon: MessageCircle, 
      label: 'SMS Communications', 
      description: 'Send SMS messages' 
    },
    { 
      href: '/admin/settings', 
      icon: Settings, 
      label: 'System Config', 
      description: 'System settings' 
    },
  ];

  const boardNavItems = [
    { 
      href: '/board', 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      description: 'Committee overview' 
    },
    { 
      href: '/board/shortlisting', 
      icon: CheckCircle, 
      label: 'Shortlisting', 
      description: 'Review & shortlist' 
    },
    { 
      href: '/board/interviews', 
      icon: Calendar, 
      label: 'Interviews', 
      description: 'Schedule & conduct' 
    },
    { 
      href: '/board/scoring', 
      icon: Award, 
      label: 'Scoring', 
      description: 'Interview assessment' 
    },
    { 
      href: '/board/reports', 
      icon: BarChart3, 
      label: 'Reports', 
      description: 'Selection reports' 
    },
  ];
  const accountNavItems = [
    {
      href: '/accounts/reports', 
      icon: BarChart3, 
      label:"claim",
      description: 'Selection reports' 
      
    },
    {
      href: '/accounts/payment', 
      icon: BarChart3, 
      label:"payment",
      description: 'Voucher Payment' 
        
      },
    {
      href: '/accounts/MIR', 
      icon: BarChart3, 
      label: "mir",      
      description: 'Register Management' 
        
      },
    {
      href: '/accounts/budget', 
      icon: BarChart3, 
      label:"budget",
      description: 'Budget Management' 
        
      },
    {
      href: '/accounts/votes', 
      icon: BarChart3, 
      label:"vote",
      description: 'Votes Management' 
        
      },
    {
      href: '/accounts/reports', 
      icon: BarChart3, 
      label:"report",
      description: 'Selection reports' 
        
      }
  ];

  const getNavItems = () => {
    switch (userRole) {
      case 'applicant':
        return applicantNavItems;
      case 'admin':
        return adminNavItems;
      case 'board':
        return boardNavItems;
      case 'accountant':
        return accountNavItems;
      default:
        return [];
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'applicant':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'board':
        return 'bg-green-100 text-green-800';
      case 'accountant':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'applicant':
        return 'Applicant';
      case 'admin':
        return 'Administrator';
      case 'board':
        return 'Board Member';
      case 'accountant':
        return 'Accountant';
      default:
        return 'User';
    }
  };

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      {/* User Profile Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImageUrl} alt={user?.firstName} />
            <AvatarFallback className="bg-primary text-white">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {(user?.firstName || '').toUpperCase()} {user?.lastName || ''}
            </p>
            <p className="text-sm text-gray-600 truncate">{user?.email}</p>
          </div>
        </div>
        <Badge className={getRoleColor()}>{getRoleLabel()}</Badge>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {getNavItems().map((item) => {
          const IconComponent = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors group ${
                  isActive
                    ? userRole === 'applicant'
                      ? 'bg-blue-50 text-primary border border-blue-200'
                      : userRole === 'admin'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-green-50 text-green-700 border border-green-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <IconComponent className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs opacity-75 truncate">{item.description}</div>
                </div>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Separator className="mb-4" />
        
        {/* Quick Stats for Applicants */}
        {userRole === 'applicant' && (
          <ProfileCompletion />
        )}

        {/* System Status for Admins */}
        {userRole === 'admin' && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-700">System Status</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Online
              </span>
            </div>
          </div>
        )}

        {/* Active Sessions for Board */}
        {userRole === 'board' && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-700">Pending Reviews</span>
              <Badge variant="secondary" className="text-xs">3</Badge>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
