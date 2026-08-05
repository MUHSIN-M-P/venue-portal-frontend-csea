'use client';

import { Header } from '@/components/Header';
import { FacultyInchargeDashboardPage } from '@/components/pages/FacultyInchargeDashboardPage';

export default function FacultyInChargePage() {
  return (
    <div className="min-h-screen bg-[#fcf0e3]">
      <Header />
      <main className="p-4 lg:p-6 max-w-7xl mx-auto">
        <FacultyInchargeDashboardPage />
      </main>
    </div>
  );
}
