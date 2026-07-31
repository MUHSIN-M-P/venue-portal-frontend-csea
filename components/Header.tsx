'use client';

import { Menu, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type HeaderProps = {
  onMenuPress?: () => void;
};

export function Header({ onMenuPress }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem('perms_logged_in');
    if (loggedIn) {
      setTimeout(() => {
        setUser({
          name: localStorage.getItem('perms_user_name') || 'User',
          email: localStorage.getItem('perms_user_email') || '',
        });
      }, 0);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('perms_logged_in');
    localStorage.removeItem('perms_token');
    localStorage.removeItem('perms_user_id');
    localStorage.removeItem('perms_user_name');
    localStorage.removeItem('perms_user_email');
    localStorage.removeItem('perms_user_role');
    localStorage.removeItem('perms_user_roles');
    router.push('/login');
  };

  return (
    <header className="bg-secondary text-white py-4 px-6 lg:px-8 shadow-md flex items-center justify-between">
      <div className="flex items-center gap-4">
        {onMenuPress && (
          <button 
            onClick={onMenuPress}
            className="lg:hidden p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight cursor-pointer" onClick={() => router.push('/')}>
          PermsPortal
        </h1>
      </div>

      {user && (
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
            <div className="w-5 h-5 rounded-full bg-white text-secondary flex items-center justify-center text-[10px] font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold leading-none">{user.name}</p>
              <p className="text-[10px] text-white/75 leading-none mt-0.5">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/15 hover:bg-white/25 transition-all px-3 py-1.5 rounded-lg border border-white/10 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
}
