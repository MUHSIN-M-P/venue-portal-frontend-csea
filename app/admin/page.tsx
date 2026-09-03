'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminDashboard } from '@/components/pages/AdminDashboard';
import { getStoredRoles, hasRole } from '@/lib/utils';

type AuthStatus = 'checking' | 'authorized' | 'unauthorized';

export default function AdminPage() {
  const router = useRouter();
  const [adminSection, setAdminSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');

  useEffect(() => {
    let authTimer: ReturnType<typeof setTimeout> | undefined;
    const loggedIn = localStorage.getItem('perms_logged_in');
    const token = localStorage.getItem('perms_token');
    const roles = getStoredRoles();

    if (!loggedIn || !token || roles.length === 0) {
      authTimer = setTimeout(() => setAuthStatus('unauthorized'), 0);
      router.replace('/login');
    } else if (!hasRole(roles, 'ADMIN')) {
      authTimer = setTimeout(() => setAuthStatus('unauthorized'), 0);
      router.replace('/');
    } else {
      authTimer = setTimeout(() => setAuthStatus('authorized'), 0);
    }

    return () => {
      if (authTimer) clearTimeout(authTimer);
    };
  }, [router]);

  if (authStatus !== 'authorized') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header onMenuPress={() => setSidebarOpen(true)} />
      <div className="flex grow flex-1 overflow-hidden">
        <AdminSidebar
          activeItem={adminSection}
          setActiveItem={setAdminSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="grow w-full min-w-0 overflow-y-auto p-3 sm:p-4 lg:p-6 transition-all duration-300">
          <AdminDashboard activeSection={adminSection} />
        </main>
      </div>
    </div>
  );
}
