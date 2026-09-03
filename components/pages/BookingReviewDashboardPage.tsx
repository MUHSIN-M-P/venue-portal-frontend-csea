'use client';

import { useEffect, useState } from 'react';
import { Card, StatCard } from '@/components/Card';
import { Tabs, TabPanelComponent } from '@/components/Tabs';
import { BookingCard } from '@/components/BookingCard';
import { useFetch } from '@/hooks/useFetch';
import { Booking } from '@/types';
import { getStoredRoles } from '@/lib/utils';

type BookingStatus =
  | 'PENDING_COORDINATOR'
  | 'PENDING_STAFF'
  | 'PENDING_FACULTY'
  | 'PENDING_HOD'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'WITHDRAWN';

type BookingLog = {
  name: string;
  email: string;
  role: string;
  action: string;
  timestamp: string;
}

type ApiBooking = {
  bookingId: number;
  eventName: string;
  eventStart: string;
  eventEnd: string;
  status: BookingStatus;
  pendingOnMe?: boolean;
  createdAt?: string;
  remarks?: string;
  description?: string;
  logs?: BookingLog[];
  club?: { clubName?: string };
  venue?: { name?: string };
};

type ReviewBooking = Booking & {
  pendingOnMe: boolean;
  logs: BookingLog[];
};

type BookingsResponse = {
  success: boolean;
  data?: ApiBooking[];
  message?: string;
};

type BookingActionResponse = {
  success: boolean;
  data?: ApiBooking;
  message?: string;
};

type BookingReviewDashboardPageProps = {
  title: string;
  /** The logged-in user's ID from localStorage (perms_user_id). */
  userId?: string | null;
  role: string;
};

function toBooking(apiBooking: ApiBooking): ReviewBooking {
  return {
    id: String(apiBooking.bookingId),
    title: apiBooking.eventName,
    venue: apiBooking.venue?.name || `Venue #${apiBooking.bookingId}`,
    startDate: apiBooking.eventStart,
    endDate: apiBooking.eventEnd,
    bookingDate: apiBooking.createdAt ? new Date(apiBooking.createdAt).toLocaleDateString() : '',
    status: apiBooking.status,
    club: apiBooking.club?.clubName,
    subject: apiBooking.description || 'No description provided.',
    logs: apiBooking.logs || [],
    pendingOnMe: Boolean(apiBooking.pendingOnMe),
  };
}

export function BookingReviewDashboardPage({ title, userId, role }: BookingReviewDashboardPageProps) {
  const { sendRequest: fetchBookings, isLoading } = useFetch<BookingsResponse>();
  const { sendRequest: approveBooking } = useFetch<BookingActionResponse>();
  const { sendRequest: rejectBooking } = useFetch<BookingActionResponse>();
  const [bookings, setBookings] = useState<ReviewBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userRoles] = useState<string[]>(() => getStoredRoles());

  useEffect(() => {
    // GET /api/bookings — filtering is done server-side via the bearer token.
    fetchBookings(`/bookings?role=${role}`, { method: 'GET' })
      .then((res) => {
        if (res) {
          setBookings((res.data || []).map(toBooking));
          setError(null);
        }
      })
      .catch((err) => setError(err.message || 'Unable to load bookings.'));
  }, [fetchBookings, userId, role]);

  const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const endpoint = newStatus === 'approved' ? `/bookings/${id}/approve` : `/bookings/${id}/reject`;
      const body = newStatus === 'approved' ? { remarks: '' } : { reason: 'Rejected from dashboard.' };
      const res = newStatus === 'approved'
        ? await approveBooking(endpoint, { method: 'POST', body })
        : await rejectBooking(endpoint, { method: 'POST', body });

      // Modify the booking and its log
      setBookings((prev) =>
        prev.map((booking) => {
          if (booking.id === id) {
            const newLog: BookingLog = {
              name: localStorage.getItem('perms_user_name') || 'User',
              email: localStorage.getItem('perms_user_email') || '',
              role: role,
              action: newStatus === 'approved' ? 'APPROVED' : 'REJECTED',
              timestamp: new Date().toISOString(),
            };
            
            booking.status = res?.data?.status || booking.status;
            booking.pendingOnMe = false; // After action, it's no longer pending on the user

            return { ...booking, logs: [...booking.logs, newLog] };
          }
          return booking;
        })
      );

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update booking.');
    }
  };

  const pendingStatuses = new Set<Booking['status']>(
    userRoles.flatMap((role) => {
      if (role === 'FACULTY_COORDINATOR') return ['PENDING_COORDINATOR'];
      if (role === 'STAFF_IN_CHARGE') return ['PENDING_STAFF'];
      if (role === 'FACULTY_IN_CHARGE') return ['PENDING_FACULTY'];
      if (role === 'HOD') return ['PENDING_HOD'];
      return [];
    }) as Booking['status'][]
  );

  const pendingRequests = bookings.filter((booking) => pendingStatuses.has(booking.status));
  const pendingOnMeRequests = pendingRequests.filter((booking) => booking.pendingOnMe);
  const pendingElsewhereRequests = pendingRequests.filter((booking) => !booking.pendingOnMe);
  const approvedRequests = bookings.filter((booking) => booking.status === 'APPROVED');
  const rejectedRequests = bookings.filter((booking) => booking.status === 'REJECTED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
        <p className="text-sm text-gray-500">Review and manage venue booking requests</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
        <StatCard title="Pending requests" shortTitle="Pending" value={isLoading ? '...' : String(pendingRequests.length)} variant="danger" />
        <StatCard title="Approved this month" shortTitle="Approved" value={isLoading ? '...' : String(approvedRequests.length)} />
      </div>

      <Card className="p-6">
        <Tabs
          tabs={[
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
          ]}
          defaultTab="pending"
        >
          <TabPanelComponent id="pending">
            <h3 className="text-base font-extrabold text-[#701A1E] tracking-wider mb-5">PENDING REQUESTS</h3>
            {pendingRequests.length === 0 ? (
              <p className="text-text-muted italic text-sm">{isLoading ? 'Loading requests...' : 'No pending requests.'}</p>
            ) : (
              <div className="space-y-6">
                {pendingOnMeRequests.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#701A1E]">Awaiting your action</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {pendingOnMeRequests.map((booking) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          showActions
                          onAccept={() => booking.id && handleAction(booking.id, 'approved')}
                          onReject={() => booking.id && handleAction(booking.id, 'rejected')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {pendingOnMeRequests.length > 0 && pendingElsewhereRequests.length > 0 && (
                  <div className="border-t-2 border-dotted border-[#7A1F32]/30" />
                )}

                {pendingElsewhereRequests.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending at other stage</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {pendingElsewhereRequests.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabPanelComponent>

          <TabPanelComponent id="approved">
            <h3 className="text-base font-extrabold text-[#701A1E] tracking-wider mb-5">APPROVAL HISTORY</h3>
            {approvedRequests.length === 0 ? (
              <p className="text-text-muted italic text-sm">No approved requests.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {approvedRequests.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabPanelComponent>

          <TabPanelComponent id="rejected">
            <h3 className="text-base font-extrabold text-[#701A1E] tracking-wider mb-5">REJECTED REQUESTS</h3>
            {rejectedRequests.length === 0 ? (
              <p className="text-text-muted italic text-sm">No rejected requests.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rejectedRequests.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabPanelComponent>
        </Tabs>
      </Card>
    </div>
  );
}
