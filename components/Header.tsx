'use client';

import { Menu, LogOut, ChevronDown, Shield, Check } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { getStoredRoles, formatRoleLabel, PortalRole, getPrimaryRouteForRoles } from '@/lib/utils';

type HeaderProps = {
  onMenuPress?: () => void;
};

export function Header({ onMenuPress }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [userRoles, setUserRoles] = useState<PortalRole[]>([]);
  const [activeRole, setActiveRole] = useState<PortalRole | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const routeRoles: Record<string, PortalRole> = {
    '/admin': 'ADMIN',
    '/club': 'CLUB',
    '/faculty_coordinator': 'FACULTY_COORDINATOR',
    '/staff_in_charge': 'STAFF_IN_CHARGE',
    '/faculty_in_charge': 'FACULTY_IN_CHARGE',
    '/hod': 'HOD',
  };

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

  useEffect(() => {
    const routeRole = routeRoles[pathname];
    if (!routeRole || !userRoles.includes(routeRole)) return;

    setActiveRole(routeRole);
    localStorage.setItem('perms_active_role', routeRole);
  }, [pathname, userRoles]);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleRoleSelect = (role: PortalRole) => {
    setActiveRole(role);
    localStorage.setItem('perms_active_role', role);
    setIsProfileMenuOpen(false);
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
    <header className="bg-secondary text-white py-3.5 px-4 sm:px-6 lg:px-8 shadow-md flex items-center justify-between z-30 relative">
      <div className="flex items-center gap-3 sm:gap-4">
        {onMenuPress && (
          <button
            onClick={onMenuPress}
            className="lg:hidden p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none cursor-pointer"
            aria-label="Toggle Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <h1
          className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight cursor-pointer select-none"
          onClick={() => router.push('/')}
        >
          PermsPortal
        </h1>
      </div>

      {user && (
        <div className="relative" ref={profileMenuRef}>
          {/* Merged Profile Button Trigger */}
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 bg-white/15 hover:bg-white/25 transition-all px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border border-white/25 text-white shadow-xs cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-7 h-7 rounded-full bg-white text-secondary flex items-center justify-center text-xs font-black shadow-xs shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block max-w-[130px] md:max-w-[180px]">
              <p className="text-xs font-bold leading-tight truncate">{user.name}</p>
              <p className="text-[10px] text-white/80 leading-tight truncate">
                {activeRole ? formatRoleLabel(activeRole) : (userRoles[0] ? formatRoleLabel(userRoles[0]) : 'User')}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-white/90 shrink-0 transition-transform duration-200 ${
                isProfileMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Unified Profile Dropdown (Account Details + Roles + Logout) */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full mt-2.5 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Account Details Header */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-full bg-secondary text-white flex items-center justify-center text-base font-bold shrink-0 shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden grow">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate" title={user.email}>{user.email || 'No email attached'}</p>
                  {activeRole && (
                    <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-white border border-slate-200/80 rounded-md text-[10px] font-bold text-secondary">
                      <Shield className="w-2.5 h-2.5" />
                      <span>{formatRoleLabel(activeRole)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Roles Section */}
              {userRoles.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <span>{userRoles.length > 1 ? 'Switch Role' : 'Assigned Role'}</span>
                    {userRoles.length > 1 && (
                      <span className="text-[10px] lowercase font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                        {userRoles.length} roles
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {userRoles.map((role) => {
                      const isSelected = activeRole === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleRoleSelect(role)}
                          className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'text-secondary bg-slate-100 font-bold shadow-xs'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Shield className={`w-3.5 h-3.5 ${isSelected ? 'text-secondary' : 'text-slate-400'}`} />
                            <span>{formatRoleLabel(role)}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-secondary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-slate-100 my-1 mx-1" />

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

