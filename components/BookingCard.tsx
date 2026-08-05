'use client';

import { useState } from 'react';
import { Button } from './Button';
import { Booking } from '@/types';
import { StatusBadge } from './Table';
import { Modal } from './Modal';
import { Calendar, Clock, MapPin, Building2, Check, X } from 'lucide-react';

type BookingCardProps = {
  booking: Booking;
  showActions?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onViewDetails?: () => void;
};

export function formatBookingDetails(startDateStr: string, endDateStr?: string) {
  const start = new Date(startDateStr);
  const isStartValid = !isNaN(start.getTime());

  if (!isStartValid) {
    return {
      dateStr: startDateStr,
      timeRange: endDateStr ? `to ${endDateStr}` : '',
      durationText: null,
      fullDateTimeStr: startDateStr,
    };
  }

  const end = endDateStr ? new Date(endDateStr) : null;
  const isEndValid = end ? !isNaN(end.getTime()) : false;

  const dateStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const numericDateStr = start.toLocaleDateString('en-US');
  const fullStartTimeStr = start.toLocaleTimeString('en-US');

  const startTimeStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  let timeRange = startTimeStr;
  let durationText: string | null = null;
  let fullDateTimeStr = `${numericDateStr}, ${fullStartTimeStr}`;

  if (isEndValid && end) {
    const endTimeStr = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const isSameDay = start.toDateString() === end.toDateString();
    if (isSameDay) {
      timeRange = `${startTimeStr} – ${endTimeStr}`;
      fullDateTimeStr = `${numericDateStr}, ${startTimeStr} – ${endTimeStr}`;
    } else {
      const endDateFormatted = end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      timeRange = `${dateStr} ${startTimeStr} – ${endDateFormatted} ${endTimeStr}`;
      fullDateTimeStr = `${numericDateStr} ${startTimeStr} – ${end.toLocaleDateString('en-US')} ${endTimeStr}`;
    }

    const diffMs = end.getTime() - start.getTime();
    if (diffMs > 0) {
      const totalMins = Math.round(diffMs / (1000 * 60));
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;

      if (hours > 0 && mins > 0) {
        durationText = `${hours} hr ${mins} mins`;
      } else if (hours > 0) {
        durationText = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      } else {
        durationText = `${mins} mins`;
      }
    }
  }

  return { dateStr, timeRange, durationText, fullDateTimeStr };
}

export function BookingCard({ booking, showActions, onAccept, onReject, onViewDetails }: BookingCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { dateStr, timeRange, durationText, fullDateTimeStr } = formatBookingDetails(
    booking.startDate,
    booking.endDate
  );

  const handleOpenDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      setIsDetailsOpen(true);
    }
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

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        title="Booking Request Details"
        className="sm:max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-start pb-3 border-b border-card-header/40">
            <div>
              <h2 className="text-lg font-bold text-text">{booking.title}</h2>
              {booking.id && <p className="text-xs text-text-muted">Booking ID #{booking.id}</p>}
            </div>
            <StatusBadge status={booking.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface border border-card-header/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Venue</span>
              <div className="flex items-center gap-1.5 font-bold text-primary">
                <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="truncate">{booking.venue}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface border border-card-header/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Organizing Body</span>
              <div className="flex items-center gap-1.5 font-bold text-text">
                <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{booking.club || 'N/A'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface border border-card-header/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Date</span>
              <div className="flex items-center gap-1.5 font-bold text-text">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{dateStr}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface border border-card-header/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Duration</span>
              <div className="flex items-center gap-1.5 font-bold text-primary">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{durationText || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-card-header/40 space-y-1 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Time Slot</span>
            <div className="flex items-center gap-1.5 font-semibold text-text">
              <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>{timeRange}</span>
            </div>
          </div>

          {booking.subject && (
            <div className="p-3 rounded-xl bg-surface border border-card-header/40 space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Purpose / Subject</span>
              <p className="text-text leading-relaxed font-medium">{booking.subject}</p>
            </div>
          )}

          {booking.bookingDate && (
            <p className="text-[11px] text-text-muted text-right">
              Requested on: {booking.bookingDate}
            </p>
          )}

          <div className="pt-3 border-t border-card-header/40 flex flex-wrap justify-end items-center gap-2">
            {showActions && (
              <>
                <Button
                  variant="success"
                  size="sm"
                  onPress={() => {
                    if (onAccept) onAccept();
                    setIsDetailsOpen(false);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2 whitespace-nowrap"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Accept Request</span>
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onPress={() => {
                    if (onReject) onReject();
                    setIsDetailsOpen(false);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2 whitespace-nowrap"
                >
                  <X className="w-4 h-4 shrink-0" />
                  <span>Reject Request</span>
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onPress={() => setIsDetailsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2 whitespace-nowrap"
            >
              <span>Close</span>
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
