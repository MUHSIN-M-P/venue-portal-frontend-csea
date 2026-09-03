'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Calendar, Clock, Compass, HelpCircle, Loader2, AlertCircle, ChevronDown } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      if (error) {
        setTimeout(() => {
          setErrorMessage(decodeURIComponent(error));
        }, 0);
      }
    }
  }, []);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setLoadingStep(1);

    setTimeout(() => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      window.location.href = `${backendUrl}/api/auth/login`;
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col justify-between overflow-x-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-secondary/15 blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />
      <div className="absolute top-[30%] right-[15%] w-[25vw] h-[25vw] rounded-full bg-accent/10 blur-[90px] pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-8 sm:pt-20 sm:pb-12 lg:py-16 z-10">
        <div className="w-full max-w-5xl flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-8 items-center">

          {/* Login Card Column (On mobile: right below top header; on desktop: right side lg:col-span-5 lg:order-2) */}
          <div className="w-full max-w-md lg:max-w-none order-1 lg:order-2 lg:col-span-5 mx-auto flex flex-col items-center">
            {/* Mobile-only Top Branding Header */}
            <div className="block lg:hidden text-center space-y-2 mb-5 w-full">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-extrabold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                NITC CSEA Portal
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-primary tracking-tight leading-none">
                PermsPortal
              </h1>
              <p className="text-xs sm:text-sm text-text-muted font-medium max-w-sm mx-auto">
                Centralized venue reservation & automated workflow approval
              </p>
            </div>

            {/* Login Card */}
            <div className="w-full bg-surface/90 backdrop-blur-md rounded-3xl sm:rounded-[2rem] border border-card-header/70 p-6 sm:p-8 lg:p-10 shadow-xl relative overflow-hidden">
              {/* Card top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-primary via-accent to-secondary" />

              <div className="text-center space-y-4 sm:space-y-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-text">Welcome Back</h2>
                  <p className="text-xs sm:text-sm text-text-muted mt-1">Please sign in to access your portal</p>
                </div>

                {/* Error message display with specific error reasons */}
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 flex gap-2.5 text-left text-xs font-medium items-start animate-fade-in shadow-sm">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <p className="font-bold text-xs sm:text-sm text-red-800">
                        {errorMessage.toLowerCase().includes('nitc')
                          ? 'NITC Email Required'
                          : errorMessage.toLowerCase().includes('not present') || errorMessage.toLowerCase().includes('registered') || errorMessage.toLowerCase().includes('database')
                            ? 'Account Not Present in Database'
                            : errorMessage.toLowerCase().includes('deactivated')
                              ? 'Account Deactivated'
                              : 'Sign-in Failed'}
                      </p>
                      <p className="text-red-700/90 leading-relaxed text-[11px] sm:text-xs">
                        {errorMessage.toLowerCase().includes('nitc') && !errorMessage.toLowerCase().includes('database')
                          ? 'This email is not from NITC. Please sign in using your official @nitc.ac.in email address.'
                          : errorMessage}
                      </p>
                      {(errorMessage.toLowerCase().includes('not present') || errorMessage.toLowerCase().includes('registered') || errorMessage.toLowerCase().includes('database') || errorMessage.toLowerCase().includes('admin')) && (
                        <div className="pt-1.5">
                          <a
                            href="mailto:admin@nitc.ac.in?subject=NITC%20Venue%20Portal%20Registration%20Request&body=Hello%20Admin,%0A%0AMy%20email%20account%20is%20not%20present%20in%20the%20database.%20Could%20you%20please%20add%20my%20account%20to%20the%20portal?%0A%0AThank%20you!"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-xs"
                          >
                            Inform Admin via Email
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Google Login Button */}
                <div className="py-1.5 sm:py-2">
                  {!isLoading ? (
                    <button
                      id="google-login-btn"
                      onClick={handleGoogleLogin}
                      className="w-full flex items-center justify-center gap-3 bg-white border border-card-header text-text font-bold py-3.5 px-5 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer"
                    >
                      {/* Google Multi-color SVG */}
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 0, 0)">
                          <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.56h3.29c1.93,-1.78 3.04,-4.4 3.04,-7.49C21.67,11.97 21.56,11.51 21.35,11.1z" fill="#4285F4" />
                          <path d="M12,20.9c2.43,0 4.47,-0.8 5.96,-2.2l-3.29,-2.56c-0.9,0.6 -2.07,0.98 -3.37,0.98 -2.35,0 -4.33,-1.58 -5.04,-3.72H2.86v2.64C4.34,19.01 7.97,20.9 12,20.9z" fill="#34A853" />
                          <path d="M6.96,13.4c-0.18,-0.54 -0.29,-1.11 -0.29,-1.7c0,-0.59 0.11,-1.16 0.29,-1.7V7.36H2.86C2.26,8.55 1.93,9.89 1.93,11.7c0,1.81 0.33,3.15 0.93,4.34L6.96,13.4z" fill="#FBBC05" />
                          <path d="M12,5.78c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,3.09 14.42,2.3 12,2.3 7.97,2.3 4.34,4.19 2.86,7.36l4.1,3.22C7.67,7.36 9.65,5.78 12,5.78z" fill="#EA4335" />
                        </g>
                      </svg>
                      <span className="text-sm sm:text-base">Sign in with Google</span>
                    </button>
                  ) : (
                    <div className="w-full bg-card/20 border border-card-header/50 py-5 px-6 rounded-2xl space-y-4 animate-fade-in">
                      <div className="flex justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-bold text-text">
                          {loadingStep === 1 && 'Connecting to Google Accounts...'}
                          {loadingStep === 2 && 'Verifying NITC Workspace domain...'}
                          {loadingStep === 3 && 'Access granted! Loading portal...'}
                        </p>
                        <div className="w-full bg-card-header/30 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all duration-500 ease-out"
                            style={{
                              width: loadingStep === 1 ? '33%' : loadingStep === 2 ? '66%' : '100%'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Domain Restrictions Notice */}
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3.5 flex gap-3 text-left">
                  <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-primary">NITC Accounts Only</h4>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      Authorization is strictly restricted to students, faculty, and staff with official <strong>@nitc.ac.in</strong> email IDs.
                    </p>
                  </div>
                </div>

                {/* Secondary Actions / Help links */}
                <div className="border-t border-card-header/40 pt-3 flex items-center justify-between text-xs text-text-muted">
                  <a href="#help" className="hover:text-primary transition-colors flex items-center gap-1">
                    Need Help?
                  </a>
                  <a href="#privacy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Features Column (Desktop left side, Mobile second section right below sign-in card) */}
          <div id="capabilities" className="w-full order-2 lg:order-1 lg:col-span-7 space-y-5 sm:space-y-8 text-left pr-0 lg:pr-6 pt-6 sm:pt-8 lg:pt-0">
            {/* Desktop Branding Header (Hidden on mobile since mobile shows top header) */}
            <div className="hidden lg:block space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-extrabold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                NITC CSEA Portal
              </span>
              <h1 className="text-5xl lg:text-6xl font-black text-primary tracking-tight leading-none">
                PermsPortal
              </h1>
              <p className="text-base sm:text-lg text-text-muted font-medium max-w-xl">
                The centralized venue reservation and automated workflow approval system for the Computer Science & Engineering Association.
              </p>
            </div>

            {/* Mobile section title with decorative line */}
            <div className="block lg:hidden text-center pt-2">
              <div className="inline-flex items-center justify-center gap-2 mb-1">
                <div className="h-px w-8 bg-card-header/80" />
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Key Portal Capabilities
                </p>
                <div className="h-px w-8 bg-card-header/80" />
              </div>
            </div>

            {/* Redesigned Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pb-8 lg:pb-0">
              <div className="p-4 sm:p-5 rounded-2xl bg-surface/60 backdrop-blur-xs border border-card-header/50 shadow-xs hover:shadow-md hover:border-accent/40 transition-all flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-sm text-text">Instant Availability</h3>
                  <p className="text-xs text-text-muted leading-relaxed">Real-time scheduling grid with automated conflict detection.</p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-surface/60 backdrop-blur-xs border border-card-header/50 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-sm text-text">Workflow Tracking</h3>
                  <p className="text-xs text-text-muted leading-relaxed">Interactive timeline with live status updates and action logs.</p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-surface/60 backdrop-blur-xs border border-card-header/50 shadow-xs hover:shadow-md hover:border-success/40 transition-all flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-success/20 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-sm text-text">Multi-stage Approvals</h3>
                  <p className="text-xs text-text-muted leading-relaxed">Seamless routing from Coordinators to Staff, Faculty, and HOD.</p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-surface/60 backdrop-blur-xs border border-card-header/50 shadow-xs hover:shadow-md hover:border-secondary/40 transition-all flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-sm text-text">Interactive Queries</h3>
                  <p className="text-xs text-text-muted leading-relaxed">Clarify booking details directly through built-in query system.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 sm:py-6 border-t border-card-header/40 text-center text-xs text-text-muted z-10 bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>&copy; {new Date().getFullYear()} Computer Science & Engineering Association. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-[10px] bg-card-header/40 px-2 py-0.5 rounded text-text font-medium">v1.2.0</span>
            <span className="text-[10px] bg-success/20 text-text px-2 py-0.5 rounded font-medium">All Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
