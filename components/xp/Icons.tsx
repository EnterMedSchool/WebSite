export function ChestIcon({ className = "w-8 h-8", color = "#f59e0b" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="chestLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="chestBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <rect x="6" y="22" width="52" height="30" rx="6" fill="url(#chestBody)" stroke="#92400e" strokeWidth="2" />
      <rect x="8" y="16" width="48" height="12" rx="6" fill="url(#chestLid)" stroke="#92400e" strokeWidth="2" />
      <rect x="30" y="30" width="4" height="10" rx="1" fill="#92400e" />
      <circle cx="32" cy="38" r="3" fill="#fef3c7" stroke="#92400e" strokeWidth="1" />
    </svg>
  );
}

export function BadgeIcon({ className = "w-8 h-8", color = "#22c55e" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="badgeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="28" r="20" fill="url(#badgeGrad)" stroke="#065f46" strokeWidth="2" />
      <path d="M22 46l10-6 10 6v10l-10-6-10 6z" fill="#10b981" stroke="#065f46" strokeWidth="2" />
      <path d="M26 28l4 4 8-8" fill="none" stroke="#065f46" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
