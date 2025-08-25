import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, Building, LogOut, User, Settings } from 'lucide-react';
import AuthDrawer from './AuthDrawer';

export default function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuthDrawer, setShowAuthDrawer] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const publicRoutes = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/faqs', label: 'FAQs' },
    { path: '/notices', label: 'Notices' },
    { path: '/jobs', label: 'Jobs' },
  ];

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthDrawer(true);
  };
  
  const handleLogout = () => {
    logout();
  };

  const getUserInitials = () => {    
    if (!user?.firstName && !user?.id) return 'U';
    return `${user?.firstName || ''}${user?.lastName || ''}`.toUpperCase();
  };

  const getDashboardUrl = () => {
    switch (user?.role) {
      case 'applicant': return '/dashboard';
      case 'admin': return '/admin';
      case 'board': return '/board';
      default: return '/';
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">TNCPSB</h1>
                <p className="text-xs text-gray-600">Job Portal</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {publicRoutes.map((route) => (
                <Link
                  key={route.path}
                  href={route.path}
                  className={`font-medium transition-colors ${
                    location === route.path
                      ? 'text-primary'
                      : 'text-gray-700 hover:text-primary'
                  }`}
                >
                  {route.label}
                </Link>
              ))}
            </div>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl} alt={user?.firstName} />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={getDashboardUrl()}>
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === 'applicant' && (
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <Settings className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button 
                    onClick={() => handleAuthClick('login')}
                    className="bg-primary hover:bg-blue-700"
                  >
                    Login
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleAuthClick('signup')}
                    className="border-primary text-primary hover:bg-blue-50"
                  >
                    Sign Up
                  </Button>
                </>
              )}

              {/* Mobile menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <nav className="flex flex-col space-y-4 mt-8">
                    {publicRoutes.map((route) => (
                      <Link
                        key={route.path}
                        href={route.path}
                        className={`text-sm font-medium transition-colors ${
                          location === route.path
                            ? 'text-primary'
                            : 'text-gray-700 hover:text-primary'
                        }`}
                      >
                        {route.label}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <AuthDrawer 
        open={showAuthDrawer} 
        onOpenChange={setShowAuthDrawer}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </>
  );
}