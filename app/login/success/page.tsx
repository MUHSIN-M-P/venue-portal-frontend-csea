'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { extractJwtRoles, setStoredRoles } from '@/lib/utils';

export default function LoginSuccessPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // Empty deps: run exactly once on mount. We access router via ref to avoid
  // the effect re-running every time Next.js refreshes the router object,
  // which was causing a double-execution that cleared the redirect timer.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        throw new Error('Authentication token was not received from the server.');
      }

      const base64Url = token.split('.')[1];
      if (!base64Url) {
        throw new Error('Invalid authentication token format.');
      }
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);

      if (!payload || !payload.email) {
        throw new Error('User profile information could not be read.');
      }

      localStorage.setItem('perms_logged_in', 'true');
      localStorage.setItem('perms_token', token);
      localStorage.setItem('perms_user_id', String(payload.userId));
      localStorage.setItem('perms_user_name', payload.name || 'User');
      localStorage.setItem('perms_user_email', payload.email);
      const roles = extractJwtRoles(payload);
      setStoredRoles(roles.length > 0 ? roles : ['ADMIN']);

      setStatus('success');

      const redirectTimer = setTimeout(() => {
        routerRef.current.push('/');
      }, 1000);

      return () => clearTimeout(redirectTimer);
    } catch (err: any) {
      console.error('Success callback error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred during sign-in validation.');
      
      // Redirect back to login page with error
      const errorTimer = setTimeout(() => {
        routerRef.current.push(`/login?error=${encodeURIComponent(err.message || 'Verification failed')}`);
      }, 3000);

      return () => clearTimeout(errorTimer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-md rounded-[2rem] border-2 border-card-header p-10 max-w-md w-full text-center shadow-xl space-y-6">
        {status === 'loading' && (
          <>
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">Verifying session...</h2>
              <p className="text-sm text-gray-500">Please wait while we secure your connection.</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">Access Granted!</h2>
              <p className="text-sm text-gray-500">Loading your personalized dashboard...</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center text-red-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">Verification Failed</h2>
              <p className="text-sm text-red-600">{errorMessage}</p>
              <p className="text-xs text-gray-400 mt-2">Redirecting you back to login page...</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
