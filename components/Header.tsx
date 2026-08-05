'use client';

import { Menu, LogOut, ChevronDown, Shield, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { getStoredRoles, formatRoleLabel, PortalRole, getPrimaryRouteForRoles } from '@/lib/utils';

type HeaderProps = {
  onMenuPress?: () => void;
};

export function Header({ onMenuPress }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [userRoles, setUserRoles] = useState<PortalRole[]>([]);
  const [activeRole, setActiveRole] = useState<PortalRole | null>(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem('perms_logged_in');
    if (loggedIn) {
      setTimeout(() => {
        setUser({
          name: localStorage.getItem('perms_user_name') || 'User',
          email: localStorage.getItem('perms_user_email') || '',
        });
        const roles = getStoredRoles();
        setUserRoles(roles);

        const storedActive = localStorage.getItem('perms_active_role') as PortalRole;
        const initialActive = storedActive && roles.includes(storedActive) ? storedActive : roles[0] || null;
        if (initialActive) {
          setActiveRole(initialActive);
        }
      }, 0);
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSelect = (role: PortalRole) => {
    setActiveRole(role);
    localStorage.setItem('perms_active_role', role);
    setIsRoleDropdownOpen(false);
    const targetRoute = getPrimaryRouteForRoles([role]);
    router.push(targetRoute);
  };

  const handleLogout = () => {
    localStorage.removeItem('perms_logged_in');
    localStorage.removeItem('perms_token');
    localStorage.removeItem('perms_user_id');
    localStorage.removeItem('perms_user_name');
    localStorage.removeItem('perms_user_email');
    localStorage.removeItem('perms_user_role');
    localStorage.removeItem('perms_user_roles');
    localStorage.removeItem('perms_active_role');
    router.push('/login');
  };

  return (
    <header className="bg-secondary text-white py-4 px-6 lg:px-8 shadow-md flex items-center justify-between z-30 relative">
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
          {/* Role Switcher Dropdown for Multi-role Users */}
          {userRoles.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              {userRoles.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 bg-accent/40 hover:bg-accent/60 transition-all px-3 py-1.5 rounded-lg border border-white/20 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>{activeRole ? formatRoleLabel(activeRole) : 'Switch Role'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white shrink-0" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15 text-xs font-bold text-white/90">
                  <Shield className="w-3.5 h-3.5 text-white/70" />
                  <span>{formatRoleLabel(userRoles[0])}</span>
                </div>
              )}

              {/* Role Selector Popup Dropdown */}
              {isRoleDropdownOpen && userRoles.length > 1 && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 text-gray-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Switch Role View
                  </div>
                  {userRoles.map((r) => {
                    const isSelected = activeRole === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleSelect(r)}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-gray-50 transition-colors ${
                          isSelected ? 'text-primary bg-card/20' : 'text-gray-700'
                        }`}
                      >
                        <span>{formatRoleLabel(r)}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
