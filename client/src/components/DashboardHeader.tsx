import { useAuth } from '@/_core/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, User } from 'lucide-react';
import { useLocation } from 'wouter';
import { getLoginUrl } from '@/const';
import RealtimeNotifications from './RealtimeNotifications';

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    window.location.href = getLoginUrl();
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  if (!user) {
    return null;
  }

  const initials = user.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side - Logo/Title */}
        <div className="flex items-center gap-3">
          <img 
            src="/logo-sm.png" 
            alt="Ologywood" 
            className="h-10 w-auto object-contain"
          />
        </div>

        {/* Right side - Notifications and User Menu */}
        <div className="flex items-center gap-4">
          {/* Real-time Notifications */}
          <RealtimeNotifications />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                    alt={user.name || 'User'}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              {/* User Info */}
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-500 capitalize mt-1">
                  {user.role === 'artist' ? '🎤 Artist' : '🎭 Venue'}
                </p>
              </div>

              <DropdownMenuSeparator />

              {/* Menu Items */}
              <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Logout */}
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
