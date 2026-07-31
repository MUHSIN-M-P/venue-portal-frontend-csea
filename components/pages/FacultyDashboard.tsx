'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Card, StatCard } from '@/components/Card';
import { TextArea } from '@/components/TextArea';
import { useFetch } from '@/hooks/useFetch';
import { Loader2, AlertCircle } from 'lucide-react';
import { Booking } from '@/types';

export function FacultyDashboard() {
  const { isLoading: isFetching, error: fetchError, sendRequest: fetchBookings } = useFetch<{ success: boolean; data: any[] }>();
  const { isLoading: isSubmitting, sendRequest: submitAction } = useFetch();

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem("perms_user_id") : null;
    if (userId) {
      fetchBookings(`/bookings/${userId}`, {
        method: 'GET',
      }).then((res) => {
        if (res) {
          const raw = res.data;
          const dataArr = Array.isArray(raw) ? raw : raw ? [raw] : [];
          setBookings(dataArr.map(toBooking));
        }
      }).catch((err) => {
        console.error('Error fetching bookings:', err);
      })
    }
  }, [fetchBookings]);

  const handleAction = (request: any, actionType: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setAction(actionType);
    setRemarks('');
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !action) return;

    try {
      const endpoint = `/api/bookings/${selectedRequest.id}/${action}`;
      await submitAction(endpoint, {
        method: 'POST',
        body: { remarks: remarks || (action === 'approve' ? 'Approved' : 'Rejected') },
      });

      // Reset and refresh
      setSelectedRequest(null);
      setAction(null);
      setRemarks('');
      const userId = typeof window !== 'undefined' ? localStorage.getItem('perms_user_id') : null;
      if (userId) {
        const res = await fetchBookings(`/bookings/${userId}`, { method: 'GET' });
        if (res) {
          const raw = res.data;
          const dataArr = Array.isArray(raw) ? raw : raw ? [raw] : [];
          setBookings(dataArr.map(toBooking));
        }
      }
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const pendingRequests = bookings.filter((b: { status?: string }) => !['APPROVED', 'REJECTED', 'CANCELLED'].includes(b.status || ''));
  console.log(bookings, pendingRequests); // Debugging log
  // bookings is the source of truth for pendingRequests and UI counts

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Welcome, Faculty Dashboard</h1>
        <p className="text-sm text-gray-500">Review and manage pending academic and administrative permission requests</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <StatCard title="Pending Review" value={pendingRequests.length.toString()} />
        <StatCard title="Approved" value={bookings.filter((b: any) => b.status === 'APPROVED').length.toString()} />
        <StatCard title="Rejected" value={bookings.filter((b: any) => b.status === 'REJECTED').length.toString()} variant="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Pending Permission Requests</h2>

            {isFetching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : fetchError ? (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle size={20} />
                <p>{fetchError}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pending requests found.</p>
                ) : (
                  pendingRequests.map((request: any) => (
                    <div key={request.bookingId} className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:border-accent transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-bold text-gray-800">{request.eventName}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                              {request.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-semibold text-gray-700">Club:</span> {request.club?.clubName || 'Unknown Club'}
                          </p>
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-semibold text-gray-700">Venue:</span> {request.venue?.name} • {new Date(request.eventStart).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            <span className="font-semibold text-gray-700">Submitted:</span> {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onPress={() => handleAction(request, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onPress={() => handleAction(request, 'reject')}
                        >
                          Reject
                        </Button>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>

        <div>
          {selectedRequest && action ? (
            <Card className="p-5 sticky top-6 border-2 border-accent">
              <h2 className="text-base font-semibold text-gray-800 mb-3">
                {action === 'approve' ? 'Approve Request' : 'Reject Request'}
              </h2>

              <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm font-bold text-gray-800">
                  {selectedRequest.eventName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Club: {selectedRequest.club?.clubName}
                </p>
              </div>

              <TextArea
                label="Remarks"
                value={remarks}
                onChange={(e) => setRemarks((e.target as HTMLTextAreaElement).value)}
                placeholder={
                  action === 'approve' ? 'Optional approval remarks...' : 'Please provide justification...'
                }
                rows={3}
                className="mb-4"
              />

              <div className="flex gap-2">
                <Button
                  variant={action === 'approve' ? 'success' : 'danger'}
                  onPress={handleConfirmAction}
                  className="flex-1"
                  isDisabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </Button>
                <Button
                  variant="outline"
                  onPress={() => {
                    setSelectedRequest(null);
                    setAction(null);
                  }}
                  isDisabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-3">Quick Actions</h2>
              <div className="space-y-3">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Select a request from the list to view full details and perform approval or rejection reviews.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

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
  clubId?: number;
  venueId?: number;
  eventName: string;
  eventStart: string;
  eventEnd: string;
  status: BookingStatus;
  initialHandlerId?: number | null;
  actionToken?: string | null;
  actionTokenExpiry?: string | null;
  createdAt?: string;
  updatedAt?: string;
  club?: {
    clubId?: number;
    clubName?: string;
    secretaryName?: string;
    secretaryEmail?: string;
    contactNumber?: string;
    facultyCoordinatorId?: number;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  venue?: {
    venueId?: number;
    name?: string;
    venueType?: string;
    location?: string;
    capacity?: number;
    isAvailable?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  currentHandlers?: Array<{
    bookingId: number;
    handlerId: number;
    handlerRole: string;
    handler?: {
      userId: number;
      name?: string;
      email?: string;
      roles?: Array<{ role: string }>;
    };
  }>;
  logs?: Array<{
    logId: number;
    bookingId: number;
    action: string;
    performedBy: number;
    timestamp: string;
    createdAt?: string;
    updatedAt?: string;
    actor?: {
      userId: number;
      name?: string;
      email?: string;
      roles?: Array<{ role: string }>;
    };
  }>;
};

function toBooking(apiBooking: ApiBooking): Booking {
  return {
    id: String(apiBooking.bookingId),
    title: apiBooking.eventName,
    venue: apiBooking.venue?.name || `Venue #${apiBooking.bookingId}`,
    startDate: new Date(apiBooking.eventStart).toLocaleString(),
    endDate: apiBooking.eventEnd ? new Date(apiBooking.eventEnd).toLocaleString() : undefined,
    bookingDate: apiBooking.createdAt ? new Date(apiBooking.createdAt).toLocaleDateString() : undefined,
    status: apiBooking.status,
    club: apiBooking.club?.clubName,
  };
}
