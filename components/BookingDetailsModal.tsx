'use client';

import { Calendar, Clock, MapPin, Building2, Check, X } from 'lucide-react';
import { Booking } from '@/types';
import { Modal } from './Modal';
import { Button } from './Button';
import { StatusBadge } from './Table';
import { BookingProgress } from './BookingProgress';

function formatDateDMY(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

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
  const dateStr = formatDateDMY(start);
  const numericDateStr = formatDateDMY(start);
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
      const endDateFormatted = formatDateDMY(end);
      timeRange = `${dateStr} ${startTimeStr} – ${endDateFormatted} ${endTimeStr}`;
      fullDateTimeStr = `${numericDateStr} ${startTimeStr} – ${endDateFormatted} ${endTimeStr}`;
    }

    const diffMs = end.getTime() - start.getTime();
    if (diffMs > 0) {
      const totalMins = Math.round(diffMs / (1000 * 60));
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      if (hours > 0 && mins > 0) durationText = `${hours} hr ${mins} mins`;
      else if (hours > 0) durationText = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      else durationText = `${mins} mins`;
    }
  }

  return { dateStr, timeRange, durationText, fullDateTimeStr };
}

type BookingDetailsModalProps = {
  booking: Booking | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  showActions?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
};

export function BookingDetailsModal({
  booking,
  isOpen,
  onOpenChange,
  showActions = false,
  onAccept,
  onReject,
}: BookingDetailsModalProps) {
  if (!booking) return null;

  const { dateStr, timeRange, durationText } = formatBookingDetails(
    booking.startDate,
    booking.endDate,
  );

  console.log("Logs", booking);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Booking Request Details"
      className="sm:max-w-lg"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
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

        <BookingProgress logs={booking.logs} />

        {booking.bookingDate && (
          <p className="text-[11px] text-text-muted text-right">
            Requested on:{' '}
            {(() => {
              const parsed = new Date(booking.bookingDate);
              return !isNaN(parsed.getTime()) ? formatDateDMY(parsed) : booking.bookingDate;
            })()}
          </p>
        )}

        <div className="pt-3 border-t border-card-header/40 flex flex-wrap justify-end items-center gap-2">
          {showActions && (
            <>
              <Button
                variant="success"
                size="sm"
                onPress={() => {
                  onAccept?.();
                  onOpenChange(false);
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
                  onReject?.();
                  onOpenChange(false);
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
            onPress={() => onOpenChange(false)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2 whitespace-nowrap"
          >
            <span>Close</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
