export interface MeetingEvent {
  id: string;
  title: string;
  description?: string | null;
  start: string; // ISO string
  end: string;   // ISO string
  roomId: string;
  roomName: string;
  roomFloor?: string | null;
  companyId: string;
  companyName: string;
  companyCode: string;
  colorCode: string;
  organizerName: string;
  organizerEmail: string;
  department: string;
  attendees?: string[];
  attendeesCount: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  specialRequests?: string | null;
  cancelReason?: string | null;
  isConfidential?: boolean;
  canViewConfidential?: boolean;
  isCreator?: boolean;
  category?: string | null;
  createdAt?: string;
  conflict?: boolean;
}

export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** Monday as start of week */
export function startOfWeek(d: Date): Date {
  const c = startOfDay(d);
  const day = c.getDay();
  const diff = c.getDate() - day + (day === 0 ? -6 : 1);
  c.setDate(diff);
  return c;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fmtTime(isoOrDate: string | Date): string {
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function fmtDay(d: Date, options?: Intl.DateTimeFormatOptions): string {
  return d.toLocaleDateString('en-GB', options || {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

/** Convert Date or ISO to "YYYY-MM-DDTHH:mm" for <input type="datetime-local" /> */
export function toLocalInput(d?: Date | string | null): string {
  const date = d ? new Date(d) : new Date();
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function getCompanyBadge(code: string): { label: string; bg: string; text: string; border: string } {
  switch (code) {
    case 'MOGEMS':
      return {
        label: 'Mogems',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200'
      };
    case 'MRA_MEDIA':
      return {
        label: 'MRA Media',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200'
      };
    case 'MRA_HOLDING':
    default:
      return {
        label: 'Holding',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200'
      };
  }
}

export function getCategoryBadge(category?: string | null) {
  const cat = (category || 'General Meeting').toLowerCase();

  if (cat.includes('interview')) {
    return {
      label: category || 'Interview',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200'
    };
  }
  if (cat.includes('weekly') && !cat.includes('bi')) {
    return {
      label: category || 'Weekly Meeting',
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200'
    };
  }
  if (cat.includes('bi-weekly') || cat.includes('biweekly')) {
    return {
      label: category || 'Bi-weekly Meeting',
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-200'
    };
  }
  if (cat.includes('monthly')) {
    return {
      label: category || 'Monthly Meeting',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200'
    };
  }
  if (cat.includes('quarterly')) {
    return {
      label: category || 'Quarterly Meeting',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200'
    };
  }
  if (cat.includes('townhall') || cat.includes('all-hands')) {
    return {
      label: category || 'Townhall',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200'
    };
  }

  return {
    label: category || 'General Meeting',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200'
  };
}
