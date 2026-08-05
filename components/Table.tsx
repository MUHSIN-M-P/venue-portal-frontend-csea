'use client';

import { cn } from '@/lib/utils';
import { formatRoleLabel } from '@/lib/utils';
import { Table as AriaTable, TableHeader, Column, TableBody, Row, Cell } from 'react-aria-components';

type TableProps = {
  headers: string[];
  children: React.ReactNode;
  className?: string;
  label?: string;
};

export function Table({ headers, children, className, label = 'Data Table' }: TableProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <AriaTable aria-label={label} className="w-full border-collapse">
          <TableHeader className="bg-card-header/30 border-b border-gray-150">
            {headers.map((header, idx) => (
              <Column
                key={idx}
                isRowHeader={idx === 0}
                className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-muted text-left outline-none"
              >
                {header}
              </Column>
            ))}
          </TableHeader>
          <TableBody>{children}</TableBody>
        </AriaTable>
      </div>
    </div>
  );
}

type TableRowProps = {
  children: React.ReactNode;
};

export function TableRow({ children }: TableRowProps) {
  return (
    <Row className="border-t border-gray-100 hover:bg-gray-50/50 focus:outline-none transition-colors">
      {children}
    </Row>
  );
}

type TableCellProps = {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
};

export function TableCell({ children, className, colSpan }: TableCellProps) {
  return (
    <Cell colSpan={colSpan} className={cn('px-4 py-3.5 text-sm text-gray-700 outline-none align-middle', className)}>
      {children}
    </Cell>
  );
}

type StatusBadgeProps = {
  status:
    | 'available'
    | 'unavailable'
    | 'forwarded'
    | 'PENDING_STAFF'
    | 'PENDING_FACULTY'
    | 'PENDING_COORDINATOR'
    | 'PENDING_HOD'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'WITHDRAWN';
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors: Record<StatusBadgeProps['status'], string> = {
    available: 'bg-emerald-50 text-emerald-700',
    unavailable: 'bg-rose-50 text-rose-700',
    forwarded: 'bg-sky-50 text-sky-700',
    APPROVED: 'bg-[#D1FAE5] text-[#065F46]',
    PENDING_STAFF: 'bg-[#FEF3C7] text-[#9A3412]',
    PENDING_FACULTY: 'bg-[#FEF3C7] text-[#9A3412]',
    PENDING_COORDINATOR: 'bg-[#FEF3C7] text-[#9A3412]',
    PENDING_HOD: 'bg-[#FEF3C7] text-[#9A3412]',
    REJECTED: 'bg-[#FEE2E2] text-[#991B1B]',
    CANCELLED: 'bg-slate-100 text-slate-600',
    WITHDRAWN: 'bg-slate-100 text-slate-600',
  };

  const labels: Record<StatusBadgeProps['status'], string> = {
    available: 'Available',
    unavailable: 'Unavailable',
    forwarded: 'Forwarded',
    APPROVED: 'Approved',
    PENDING_STAFF: 'Pending (Staff)',
    PENDING_FACULTY: 'Pending (Faculty)',
    PENDING_COORDINATOR: 'Pending (Coordinator)',
    PENDING_HOD: 'Pending (HOD)',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    WITHDRAWN: 'Withdrawn',
  };

  return (
    <span className={cn('px-3.5 py-1 rounded-full text-xs font-semibold inline-flex items-center tracking-tight', colors[status])}>
      {labels[status]}
    </span>
  );
}

type RoleBadgeProps = {
  role: string[];
};

export function RoleBadge({ role }: RoleBadgeProps) {
  if (!role || role.length === 0) {
    return (
      <span className="px-2.5 py-1 rounded-full font-medium bg-gray-50 border border-gray-200 text-gray-600 text-xs inline-flex items-center">
        -
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {role.map((r) => (
        <span
          key={r}
          className="px-2.5 py-1 rounded-full font-medium bg-gray-50 border border-gray-200 text-gray-600 text-xs inline-flex items-center"
        >
          {formatRoleLabel(r)}
        </span>
      ))}
    </div>
  );
}
