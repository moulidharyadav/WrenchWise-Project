import React from 'react';

export type StatusType = 
  | 'CLEARED'
  | 'PENDING'
  | 'REJECTED'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUCCESS'
  | 'COMPLETED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'FLAGGED'
  | 'FAILED'
  | 'ERROR'
  | 'DENIED'
  | 'REFERRED_HITL'
  | 'STABLE'
  | 'DRIFT_DETECTED'
  | string;

interface StatusBadgeProps {
  status: StatusType | null | undefined;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const getStatusVariant = (rawStatus: string | null | undefined): {
  bg: string;
  text: string;
  border: string;
  dotColor: string;
} => {
  const s = (rawStatus || '').toUpperCase().trim();

  // CLEARED / SUCCESS / APPROVED / ACTIVE / COMPLETED / DELIVERED / STABLE -> Green / Teal
  if (['CLEARED', 'SUCCESS', 'APPROVED', 'ACTIVE', 'COMPLETED', 'DELIVERED', 'DISPATCHED', 'STABLE', 'ONLINE', 'HEALTHY'].includes(s)) {
    return {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dotColor: 'bg-emerald-400',
    };
  }

  // PENDING / REFERRED_HITL / REVIEW / PROCESSING / MEDIUM / WARNING -> Amber / Yellow
  if (['PENDING', 'REFERRED_HITL', 'REVIEW', 'PROCESSING', 'MEDIUM', 'WARN', 'WARNING', 'IN_PROGRESS', 'QUEUED'].includes(s)) {
    return {
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dotColor: 'bg-amber-400',
    };
  }

  // REJECTED / FLAGGED / FAILED / ERROR / DENIED / CRITICAL / HIGH -> Red / Rose
  if (['REJECTED', 'FLAGGED', 'FAILED', 'ERROR', 'DENIED', 'CRITICAL', 'HIGH', 'BLOCKED', 'DRIFT_DETECTED'].includes(s)) {
    return {
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      dotColor: 'bg-rose-400',
    };
  }

  // Fallback for neutral / info (LOW, INFO, STANDARD, TIER_*, etc.) -> Sky / Cyan
  return {
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    dotColor: 'bg-cyan-400',
  };
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'xs',
  className = '',
  dot = false,
}) => {
  if (!status) return null;

  const style = getStatusVariant(status);
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold font-mono uppercase tracking-wider rounded-md border ${style.bg} ${style.text} ${style.border} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor} animate-pulse`} />}
      <span>{status}</span>
    </span>
  );
};
