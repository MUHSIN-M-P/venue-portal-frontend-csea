'use client';

import { useState } from 'react';
import { Booking } from '@/types';
import { StatusBadge } from './Table';
import { BookingDetailsModal, formatBookingDetails } from './BookingDetailsModal';
import { Calendar, MapPin, Check, X } from 'lucide-react';

type BookingCardProps = {
  booking: Booking;
  showActions?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
};

export function BookingCard({ booking, showActions, onAccept, onReject }: BookingCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  console.log('BookingCard booking:', booking);

  const { fullDateTimeStr } = formatBookingDetails(
    booking.startDate,
    booking.endDate
  );

  const handleOpenDetails = () => {
    setIsDetailsOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-[26px] border border-[#7A1F32]/25 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-4px_rgba(122,31,50,0.12)] transition-all duration-300 flex flex-col justify-between font-sans">
        {/* Top Header: Title and Status Badge */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className="text-lg font-bold text-slate-900 line-clamp-1 flex-1 tracking-tight">
            {booking.title}
          </h3>
          <div className="shrink-0">
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {/* Venue & Club with MapPin icon */}
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-[#0E7490] shrink-0" />
          <span className="text-sm font-semibold text-[#0E7490] truncate">
            {booking.venue}
            {booking.club && <span className="text-slate-400 font-normal ml-1">({booking.club})</span>}
          </span>
        </div>

        {/* Date & Time with Calendar icon */}
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-sm font-normal text-slate-500 truncate">
            {fullDateTimeStr}
          </span>
        </div>

        {/* Action Buttons with Divider line above */}
        {showActions && (
          <div className="pt-3.5 mt-1 border-t border-[#7A1F32]/15">
            <div className="flex items-center justify-between gap-3 mb-3 w-full">
              <button
                type="button"
                onClick={onAccept}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-full text-sm font-semibold bg-[#9CE6B8] hover:bg-[#86EFAC] text-[#065F46] shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>Accept</span>
              </button>
              <button
                type="button"
                onClick={onReject}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-full text-sm font-semibold bg-[#F8A3A3] hover:bg-[#FCA5A5] text-[#991B1B] shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <X className="w-4 h-4 shrink-0" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        )}

        {/* See Details link */}
        <div className={showActions ? '' : 'pt-2'}>
          <button
            type="button"
            onClick={handleOpenDetails}
            className="text-sm font-medium text-[#0284C7] hover:text-[#0369A1] underline underline-offset-3 cursor-pointer transition-colors"
          >
            See details
          </button>
        </div>
      </div>

      <BookingDetailsModal
        booking={booking}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        showActions={showActions}
        onAccept={onAccept}
        onReject={onReject}
      />
    </>
  );
}
