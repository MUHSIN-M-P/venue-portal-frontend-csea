'use client';

import { Check, Circle, X } from 'lucide-react';
import { BookingLog } from '@/types';
import { cn, formatRoleLabel } from '@/lib/utils';

const PIPELINE_STEPS = [
  { role: 'CLUB', label: 'Request submitted' },
  { role: 'FACULTY_COORDINATOR', label: 'Faculty Coordinator' },
  { role: 'STAFF_IN_CHARGE', label: 'Staff In Charge' },
  { role: 'FACULTY_IN_CHARGE', label: 'Faculty In Charge' },
] as const;

type StepState = 'completed' | 'rejected' | 'current' | 'upcoming';

type ResolvedStep = {
  role: string;
  label: string;
  state: StepState;
  log?: BookingLog;
  isFinal: boolean;
};

function formatLogTime(iso: string) {
  const parsed = new Date(iso);
  if (isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatAction(action: string) {
  if (action === 'BOOKING_CREATED') return 'Submitted';
  return formatRoleLabel(action);
}

function resolveSteps(logs: BookingLog[] = []): ResolvedStep[] {
  const byRole = new Map<string, BookingLog>();
  for (const log of logs) {
    if (log.role) byRole.set(log.role, log);
  }

  const lastLoggedIndex = PIPELINE_STEPS.reduce(
    (latest, step, index) => (byRole.has(step.role) ? index : latest),
    -1,
  );
  const rejectedIndex = PIPELINE_STEPS.findIndex(
    (step) => byRole.get(step.role)?.action === 'REJECTED',
  );

  return PIPELINE_STEPS.map((step, index) => {
    const log = byRole.get(step.role);
    const isFinal = index === PIPELINE_STEPS.length - 1;
    let state: StepState = 'upcoming';

    if (rejectedIndex !== -1) {
      if (index < rejectedIndex) state = 'completed';
      else if (index === rejectedIndex) state = 'rejected';
      else state = 'upcoming';
    } else if (lastLoggedIndex === -1) {
      if (index === 0) state = 'completed';
      else if (index === 1) state = 'current';
      else state = 'upcoming';
    } else if (index <= lastLoggedIndex) {
      state = 'completed';
    } else if (index === lastLoggedIndex + 1) {
      state = 'current';

      console.log('current step:', step.role, 'last logged index:', lastLoggedIndex);
    }

    return { ...step, state, log, isFinal };
  });
}

export function BookingProgress({ logs }: { logs?: BookingLog[] }) {
  const steps = resolveSteps(logs);
  console.log(logs, 'resolved steps:', steps);
  return (
    <div className="p-3 rounded-xl bg-surface border border-card-header/40 space-y-3 text-xs">
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
        Approval progress
      </span>
      <ol className="space-y-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li key={step.role} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StepIcon state={step.state} />
                {!isLast && (
                  <div
                    className={cn(
                      'w-px flex-1 min-h-6 my-1',
                      step.state === 'completed' && 'bg-emerald-400',
                      step.state === 'rejected' && 'bg-red-300',
                      (step.state === 'current' || step.state === 'upcoming') && 'bg-gray-200',
                    )}
                  />
                )}
              </div>
              <div className={cn('pb-4 min-w-0 flex-1', isLast && 'pb-0')}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className={cn(
                      'font-bold',
                      step.state === 'completed' && 'text-text',
                      step.state === 'rejected' && 'text-red-700',
                      step.state === 'current' && 'text-primary',
                      step.state === 'upcoming' && 'text-text-muted',
                    )}
                  >
                    {step.label}
                  </p>
                  {step.isFinal && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      Final
                    </span>
                  )}
                  {step.state === 'current' && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      Awaiting
                    </span>
                  )}
                </div>
                {step.log ? (
                  <div className="mt-0.5 text-text-muted space-y-0.5">
                    <p className="font-medium text-text">
                      {formatAction(step.log.action)}
                      {step.log.name ? ` · ${step.log.name}` : ''}
                    </p>
                    {step.log.email && <p className="truncate">{step.log.email}</p>}
                    <p>{formatLogTime(step.log.timestamp)}</p>
                  </div>
                ) : (
                  <p className="mt-0.5 text-text-muted">
                    {step.state === 'current'
                      ? 'Waiting for review'
                      : step.state === 'upcoming'
                        ? 'Not reached yet'
                        : 'Completed'}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepIcon({ state }: { state: StepState }) {
  if (state === 'completed') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
        <Check className="w-3 h-3" />
      </span>
    );
  }
  if (state === 'rejected') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shrink-0">
        <X className="w-3 h-3" />
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary bg-white shrink-0">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-300 shrink-0">
      <Circle className="w-2.5 h-2.5" />
    </span>
  );
}
