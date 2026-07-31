import { useEffect, useState } from "react";
import { BookingReviewDashboardPage } from "./BookingReviewDashboardPage";

export function StaffInchargeDashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("perms_user_id"));
  }, []);

  return (
    <BookingReviewDashboardPage
      title="Welcome, Staff Incharge"
      userId={userId}
      role="STAFF_IN_CHARGE"
    />
  );
}
