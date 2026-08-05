'use client';

import { useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { Booking } from '@/types';
import { StatusBadge } from './Table';
import { Modal } from './Modal';
import { Calendar, Clock, MapPin, Building2, ChevronRight, Check, X } from 'lucide-react';

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
    };
  }

  const end = endDateStr ? new Date(endDateStr) : null;
  const isEndValid = end ? !isNaN(end.getTime()) : false;

  const dateStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const startTimeStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  let timeRange = startTimeStr;
  let durationText: string | null = null;

  if (isEndValid && end) {
    const endTimeStr = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const isSameDay = start.toDateString() === end.toDateString();
    if (isSameDay) {
      timeRange = `${startTimeStr} – ${endTimeStr}`;
    } else {
      const endDateFormatted = end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      timeRange = `${dateStr} ${startTimeStr} – ${endDateFormatted} ${endTimeStr}`;
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

  return { dateStr, timeRange, durationText };
}

export function BookingCard({ booking, showActions, onAccept, onReject, onViewDetails }: BookingCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { dateStr, timeRange, durationText } = formatBookingDetails(booking.startDate, booking.endDate);

  const handleOpenDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      setIsDetailsOpen(true);
    }
  };

  return (
    <>
      <Card className="p-5 flex flex-col justify-between border border-card-header/60 bg-surface/90 shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl group relative overflow-hidden">
        <div className="space-y-3">
          {/* Header row: Title & Status */}
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-base font-bold text-text line-clamp-1 flex-1 group-hover:text-primary transition-colors">
              {booking.title}
            </h3>
            <StatusBadge status={booking.status} />
          </div>

          {/* Venue & Club metadata */}
          <div className="space-y-1.5 text-xs text-text-muted">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-accent" />
              <span className="truncate">{booking.venue}</span>
            </div>
            {booking.club && (
              <div className="flex items-center gap-1.5 font-medium text-text-muted">
                <Building2 className="w-3.5 h-3.5 shrink-0 text-text-muted/70" />
                <span className="truncate">{booking.club}</span>
              </div>
            )}
          </div>

          {/* Time & Duration Badge */}
          <div className="pt-2 border-t border-card-header/40 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-text-muted">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span className="font-medium text-text">{dateStr}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-text-muted">
                <Clock className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span>{timeRange}</span>
              </div>
              {durationText && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary shrink-0">
                  {durationText}
                </span>
              )}
            </div>
          </div>

          {booking.subject && (
            <p className="text-xs text-text-muted line-clamp-2 italic bg-card/20 p-2 rounded-lg border border-card-header/30">
              "{booking.subject}"
            </p>
          )}
        </div>

        {/* Action buttons & See Details trigger */}
        <div className="mt-4 pt-3 border-t border-card-header/40 space-y-3">
          {showActions && (
            <div className="flex items-center gap-2">
              <Button
                variant="success"
                size="sm"
                onPress={onAccept}
                className="flex-1 justify-center gap-1 rounded-xl shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept</span>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onPress={onReject}
                className="flex-1 justify-center gap-1 rounded-xl shadow-xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={handleOpenDetails}
            className="w-full flex items-center justify-between text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-1 group/btn cursor-pointer"
          >
            <span>See details</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </Card>

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

          <div className="pt-3 border-t border-card-header/40 flex justify-end gap-2">
            {showActions && (
              <>
                <Button
                  variant="success"
                  size="sm"
                  onPress={() => {
                    if (onAccept) onAccept();
                    setIsDetailsOpen(false);
                  }}
                  className="gap-1 rounded-xl px-4"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept Request</span>
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onPress={() => {
                    if (onReject) onReject();
                    setIsDetailsOpen(false);
                  }}
                  className="gap-1 rounded-xl px-4"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject Request</span>
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onPress={() => setIsDetailsOpen(false)}
              className="rounded-xl px-4"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
