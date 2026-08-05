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

type ApiBooking = {
  bookingId: number;
  eventName: string;
  eventStart: string;
  eventEnd: string;
  status: BookingStatus;
  createdAt?: string;
  remarks?: string;
  description?: string;
  club?: { clubName?: string };
  venue?: { name?: string };
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

function toBooking(apiBooking: ApiBooking): Booking {
  return {
    id: String(apiBooking.bookingId),
    title: apiBooking.eventName,
    venue: apiBooking.venue?.name || `Venue #${apiBooking.bookingId}`,
    startDate: apiBooking.eventStart,
    endDate: apiBooking.eventEnd,
    bookingDate: apiBooking.createdAt ? new Date(apiBooking.createdAt).toLocaleDateString() : '',
    status: apiBooking.status,
    club: apiBooking.club?.clubName,
    subject: apiBooking.remarks || apiBooking.description || 'No additional remarks provided.',
  };
}

export function BookingReviewDashboardPage({ title, userId, role }: BookingReviewDashboardPageProps) {
  const { sendRequest: fetchBookings, isLoading } = useFetch<BookingsResponse>();
  const { sendRequest: approveBooking } = useFetch<BookingActionResponse>();
  const { sendRequest: rejectBooking } = useFetch<BookingActionResponse>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    // GET /api/bookings — filtering is done server-side via the bearer token.
    setUserRoles(getStoredRoles());

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

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === id && res && res.data ? toBooking(res.data) : booking
        )
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <StatCard title="Pending requests" value={isLoading ? '...' : String(pendingRequests.length)} variant="danger" />
        <StatCard title="Approved this month" value={isLoading ? '...' : String(approvedRequests.length)} />
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
            <h3 className="text-base font-bold text-primary mb-4">PENDING REQUESTS</h3>
            {pendingRequests.length === 0 ? (
              <p className="text-text-muted italic text-sm">{isLoading ? 'Loading requests...' : 'No pending requests.'}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingRequests.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    showActions
                    onAccept={() => booking.id && handleAction(booking.id, 'approved')}
                    onReject={() => booking.id && handleAction(booking.id, 'rejected')}
                  />
                ))}
              </div>
            )}
          </TabPanelComponent>

          <TabPanelComponent id="approved">
            <h3 className="text-base font-bold text-primary mb-4">APPROVAL HISTORY</h3>
            {approvedRequests.length === 0 ? (
              <p className="text-text-muted italic text-sm">No approved requests.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedRequests.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabPanelComponent>

          <TabPanelComponent id="rejected">
            <h3 className="text-base font-bold text-primary mb-4">REJECTED REQUESTS</h3>
            {rejectedRequests.length === 0 ? (
              <p className="text-text-muted italic text-sm">No rejected requests.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
