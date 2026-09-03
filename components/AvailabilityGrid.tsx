'use client';

import { useState, useEffect } from 'react';

const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = ['00:00', ...Array.from({ length: 23 }, (_, i) => `${String(i + 1).padStart(2, '0')}:00`)];

type SelectionState = {
  dayIndex: number;
  hourIndex: number;
} | null;

type AvailabilityGridProps = {
  selectedVenue?: string;
  selectedVenueId?: string;
  onSelectRange: (startISO: string, endISO: string, rangeText: string) => void;
};


export function AvailabilityGrid({
  selectedVenue = 'SSL Lab',
  selectedVenueId,
  onSelectRange
}: AvailabilityGridProps) {
  const generateVenueData = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const fullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grid: Record<string, number[]> = {};
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + i);
      const key = fullNames[d.getDay()];
      grid[key] = i === 0
        ? Array.from({ length: 24 }, (_, h) => (h <= currentHour ? 0 : 1))
        : Array(24).fill(1);
    });
    return grid;
  };
  
  const [dynamicVenueData, setDynamicVenueData] = useState<Record<string, number[]>>(
    generateVenueData()
  );

  const [selectionStart, setSelectionStart] = useState<SelectionState>(null);
  const [selectionEnd, setSelectionEnd] = useState<SelectionState>(null);

  // Build a 7-day window starting from today
  const getNext7Days = (): Date[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  };

  // Stable alias used throughout the component
  const getDatesForCurrentWeek = getNext7Days;

  // DAYS drives column order — built from today's weekday names
  const DAYS = getNext7Days().map(d => {
    const fullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return fullNames[d.getDay()];
  });

  useEffect(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
    onSelectRange('', '', 'No date or time range selected. Click on the availability grid below to choose a time.');
  }, [selectedVenueId]);

  useEffect(() => {
    if (!selectedVenueId) return;

    const getSchedule = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('perms_token') : null;
        let currentClubId = -1;
        if (token) {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const payload = JSON.parse(jsonPayload);
            currentClubId = payload.userId;
          } catch (e) {
            console.error(e);
          }
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        const url = `${backendUrl}/api/bookings/venues/${selectedVenueId}/schedule`;
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        };

        const res = await fetch(url, { headers });
        if (res.ok) {
          const resData = await res.json();
          if (resData && resData.success && Array.isArray(resData.bookings)) {
                        const generateGrid = (): Record<string, number[]> => {
                          const now = new Date();
                          const currentHour = now.getHours();
                          const grid: Record<string, number[]> = {};

                          // Use the same 7-day window: index 0 = today
                          getNext7Days().forEach((date, index) => {
                            const fullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            const dayKey = fullNames[date.getDay()];
                            if (index === 0) {
                              // Today: hours up to and including current hour are off
                              grid[dayKey] = Array.from({ length: 24 }, (_, hour) =>
                                hour <= currentHour ? 0 : 1
                              );
                            } else {
                              // Future days: all available
                              grid[dayKey] = Array(24).fill(1);
                            }
                          });

                          return grid;
                        };

                        const grid = generateGrid();

            const weekDates = getDatesForCurrentWeek();

            resData.bookings.forEach((booking: any) => {
              if (["REJECTED", "WITHDRAWN", "CANCELLED"].includes(booking.status)) {
                return;
              }

              const eventStart = new Date(booking.eventStart);
              const eventEnd = new Date(booking.eventEnd);

              DAYS.forEach((day, dayIndex) => {
                const date = weekDates[dayIndex];
                for (let hourIndex = 0; hourIndex < 24; hourIndex++) {
                  const slotStart = new Date(date);
                  slotStart.setHours(hourIndex, 0, 0, 0);

                  const slotEnd = new Date(date);
                  slotEnd.setHours(hourIndex + 1, 0, 0, 0);

                  if (slotStart.getTime() < eventEnd.getTime() && slotEnd.getTime() > eventStart.getTime()) {
                    const isOwn = booking.clubId === currentClubId;
                    grid[day][hourIndex] = isOwn ? 3 : 2;
                  }
                }
              });
            });

            setDynamicVenueData(grid);
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic venue schedule:', err);
      }
    };

    getSchedule();
  }, [selectedVenueId]);

  const getCellColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-[#F3E8DB]'; // off hours
      case 1: return 'bg-[#5476A594]'; // available
      case 2: return 'bg-[#BB7C83]'; // occupied
      case 3: return 'bg-[#AAB488]'; // your booking
      default: return 'bg-[#8ea8c2]';
    }
  };

  const getDayLabel = (_dayName: string, index: number) => {
    const d = getNext7Days()[index];
    const dateStr = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
    return `${DAY_ABBREVS[d.getDay()]} (${dateStr})`;
  };

  const getMobileDayHeader = (index: number) => {
    const d = getNext7Days()[index];
    const dateStr = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
    return {
      dayAbbrev: DAY_ABBREVS[d.getDay()],
      dateStr,
    };
  };

  const formatHour12 = (h: number | string) => {
    const num = typeof h === 'string' ? parseInt(h.split(':')[0], 10) : h;
    const normalizedH = ((num % 24) + 24) % 24;
    const period = normalizedH >= 12 ? 'PM' : 'AM';
    const h12 = normalizedH % 12 === 0 ? 12 : normalizedH % 12;
    const pad = String(h12).padStart(2, '0');
    return `${pad}:00 ${period}`;
  };

  const updateRange = (
    start: { dayIndex: number; hourIndex: number },
    end: { dayIndex: number; hourIndex: number } | null
  ) => {
    const weekDates = getDatesForCurrentWeek();
    const startDate = weekDates[start.dayIndex];
    
    const startHour = start.hourIndex;
    const startObj = new Date(startDate);
    startObj.setHours(startHour, 0, 0, 0);

    const endDate = weekDates[end ? end.dayIndex : start.dayIndex];
    const endObj = new Date(endDate);
    const endHour = end ? end.hourIndex + 1 : start.hourIndex + 1;
    endObj.setHours(endHour, 0, 0, 0);

    const formatDate = (date: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
    };

    const fullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const startDayName = fullNames[startDate.getDay()];
    const endDayName = fullNames[endObj.getDay()];

    let rangeText = '';
    if (!end || start.dayIndex === end.dayIndex) {
      rangeText = `${startDayName} (${formatDate(startDate)}) from ${formatHour12(startHour)} to ${formatHour12(endHour)}`;
    } else {
      rangeText = `${startDayName} (${formatDate(startDate)}) ${formatHour12(startHour)} to ${endDayName} (${formatDate(endObj)}) ${formatHour12(endHour)}`;
    }

    onSelectRange(startObj.toISOString(), endObj.toISOString(), rangeText);
  };

  const onSelectCell = (dayIndex: number, hourIndex: number) => {
    const flatStart = selectionStart ? selectionStart.dayIndex * 24 + selectionStart.hourIndex : -1;
    const flatClicked = dayIndex * 24 + hourIndex;

    const isSlotAvailable = (flatIdx: number) => {
      const dIdx = Math.floor(flatIdx / 24);
      const hIdx = flatIdx % 24;
      const dLabel = DAYS[dIdx];
      const status = (dynamicVenueData[dLabel] || Array(24).fill(1))[hIdx];
      return status === 1;
    };

    if (flatStart === -1 || flatClicked <= flatStart || selectionEnd !== null) {
      setSelectionStart({ dayIndex, hourIndex });
      setSelectionEnd(null);
      updateRange({ dayIndex, hourIndex }, null);
    } else {
      let currentFlatEnd = flatClicked;
      let blocked = false;

      for (let f = flatStart + 1; f <= flatClicked; f++) {
        if (!isSlotAvailable(f)) {
          blocked = true;
          currentFlatEnd = f - 1;
          break;
        }
      }

      if (blocked) {
        if (currentFlatEnd === flatStart) {
          setSelectionStart({ dayIndex, hourIndex });
          setSelectionEnd(null);
          updateRange({ dayIndex, hourIndex }, null);
          alert("Range selection was blocked by an unavailable slot. Started new selection at clicked slot.");
        } else {
          if (!selectionStart) return;
          const endObj = {
            dayIndex: Math.floor(currentFlatEnd / 24),
            hourIndex: currentFlatEnd % 24
          };
          setSelectionEnd(endObj);
          updateRange(selectionStart, endObj);
          alert("Range selection stopped before the unavailable slot.");
        }
      } else {
        if (!selectionStart) return;
        const endObj = { dayIndex, hourIndex };
        setSelectionEnd(endObj);
        updateRange(selectionStart, endObj);
      }
    }
  };

  return (
    <div className="bg-[#fdf6ee] rounded-3xl p-4 sm:p-6 shadow-sm border border-card-header/40 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
        <h3 className="text-base font-semibold text-text-muted">Venue Availability Grid — {selectedVenue}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">Click an available slot to set the start time, and click a later slot (even across multiple days) to set the end time.</p>
      
      {/* Mobile Rotated Vertical View (block md:hidden) */}
      <div className="block md:hidden">
        {/* Days Header Row */}
        <div className="flex items-center pb-2 border-b border-card-header/40 mb-2 sticky top-0 bg-[#fdf6ee] z-10 pt-1">
          <div className="w-11 shrink-0 text-left text-[11px] font-bold text-text-muted">Time</div>
          <div className="grow grid grid-cols-7 gap-1">
            {DAYS.map((day, dayIndex) => {
              const { dayAbbrev, dateStr } = getMobileDayHeader(dayIndex);
              return (
                <div key={day} className="text-center">
                  <div className="text-xs font-bold text-text-muted">{dayAbbrev}</div>
                  <div className="text-[10px] text-text-muted/80">{dateStr}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 24 Hours Rows */}
        <div className="max-h-[480px] overflow-y-auto space-y-1.5 pr-1">
          {HOURS.map((hour, hourIndex) => {
            const hrNum = hour.slice(0, 2);
            const minPart = hour.slice(2);
            return (
              <div key={hour} className="flex items-center">
                <div className="w-11 shrink-0 text-left leading-none">
                  <span className="text-xs font-bold text-text-muted">{hrNum}</span>
                  <span className="text-[10px] font-semibold text-text-muted">{minPart}</span>
                </div>
                <div className="grow grid grid-cols-7 gap-1">
                  {DAYS.map((day, dayIndex) => {
                    const status = (dynamicVenueData[day] || Array(24).fill(1))[hourIndex];
                    const flatCurrent = dayIndex * 24 + hourIndex;
                    const flatStart = selectionStart ? selectionStart.dayIndex * 24 + selectionStart.hourIndex : -1;
                    const flatEnd = selectionEnd ? selectionEnd.dayIndex * 24 + selectionEnd.hourIndex : -1;

                    const isSelected = selectionStart !== null && (
                      selectionEnd === null 
                        ? flatCurrent === flatStart 
                        : (flatCurrent >= flatStart && flatCurrent <= flatEnd)
                    );
                    
                    const isSelectable = status === 1;
                    
                    let bgClass = getCellColor(status);
                    if (isSelected) {
                      bgClass = 'bg-primary text-white font-bold ring-1 ring-offset-1 ring-primary';
                    }

                    return (
                      <button
                        key={dayIndex}
                        type="button"
                        disabled={!isSelectable}
                        onClick={() => onSelectCell(dayIndex, hourIndex)}
                        className={`h-8 rounded-md border-0 transition-all ${bgClass} ${
                          isSelectable 
                            ? 'cursor-pointer active:scale-95' 
                            : 'cursor-not-allowed opacity-60'
                        }`}
                        title={`${day} at ${formatHour12(hourIndex)} (${status === 1 ? 'Available - Click to select' : status === 2 ? 'Occupied' : status === 0 ? 'Off hours' : 'Your booking'})`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Horizontal View (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto pb-4">
        <div className="min-w-[960px] px-1">
          {/* Hours header row - Left shifted hours, smaller zeros of minute, starting at box edge */}
          <div className="flex mb-3">
            <div className="w-24 shrink-0 font-semibold text-xs text-text-muted pr-2">Day / Time</div>
            <div className="grow grid grid-cols-24 gap-1.5">
              {HOURS.map((hour) => (
                <div key={hour} className="text-left overflow-visible leading-none ">
                  <span className="text-xs font-bold text-text-muted">{hour.slice(0, 2)}</span>
                  <span className="text-[9px] font-semibold text-text-muted">{hour.slice(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Days rows */}
          <div className="space-y-1.5">
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center">
                <div className="w-24 shrink-0 font-semibold text-xs text-text-muted pr-2">
                  {getDayLabel(day, dayIndex)}
                </div>
                <div className="grow grid grid-cols-24 gap-1.5">
                  {(dynamicVenueData[day] || Array(24).fill(1)).map((status, hourIndex) => {
                    const flatCurrent = dayIndex * 24 + hourIndex;
                    const flatStart = selectionStart ? selectionStart.dayIndex * 24 + selectionStart.hourIndex : -1;
                    const flatEnd = selectionEnd ? selectionEnd.dayIndex * 24 + selectionEnd.hourIndex : -1;

                    const isSelected = selectionStart !== null && (
                      selectionEnd === null 
                        ? flatCurrent === flatStart 
                        : (flatCurrent >= flatStart && flatCurrent <= flatEnd)
                    );
                    
                    const isSelectable = status === 1;
                    
                    let bgClass = getCellColor(status);
                    if (isSelected) {
                      bgClass = 'bg-primary text-white font-bold ring-1 ring-offset-1 ring-primary';
                    }

                    return (
                      <button
                        key={hourIndex}
                        type="button"
                        disabled={!isSelectable}
                        onClick={() => onSelectCell(dayIndex, hourIndex)}
                        className={`h-8 rounded-md border-0 transition-all ${bgClass} ${
                          isSelectable 
                            ? 'cursor-pointer hover:opacity-85 hover:scale-105' 
                            : 'cursor-not-allowed opacity-60'
                        }`}
                        title={`${day} at ${formatHour12(hourIndex)} (${status === 1 ? 'Available - Click to select' : status === 2 ? 'Occupied' : status === 0 ? 'Off hours' : 'Your booking'})`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend inside the card */}
      <div className="flex flex-wrap gap-4 sm:gap-6 mt-6 pt-5 border-t border-card-header/40">
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-md ${getCellColor(1)}`} />
          <span className="text-xs sm:text-sm font-semibold text-text-muted">available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-md ${getCellColor(2)}`} />
          <span className="text-xs sm:text-sm font-semibold text-text-muted">occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-md ${getCellColor(0)}`} />
          <span className="text-xs sm:text-sm font-semibold text-text-muted">off hours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-md ${getCellColor(3)}`} />
          <span className="text-xs sm:text-sm font-semibold text-text-muted">your booking</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-primary" />
          <span className="text-xs sm:text-sm font-semibold text-text-muted">your selection</span>
        </div>
      </div>
    </div>
  );
}

