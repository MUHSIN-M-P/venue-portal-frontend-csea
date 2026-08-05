'use client';

import { useEffect, useState } from "react";
import { BookingReviewDashboardPage } from "./BookingReviewDashboardPage";

export function FacultyInchargeDashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("perms_user_id"));
  }, []);

  return (
    <BookingReviewDashboardPage
      title="Welcome, Faculty In Charge"
      userId={userId}
      role="FACULTY_IN_CHARGE"
    />
  );
}
