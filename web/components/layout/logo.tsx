export function Logo({ compact, dark }: { compact?: boolean; dark?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 40 40" className="h-8 w-8 shrink-0" aria-hidden>
        <defs>
          <linearGradient id="fc-a" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#22c55e" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="16" fill="none" stroke="url(#fc-a)" strokeWidth="6" strokeDasharray="70 30" />
        <circle cx="20" cy="20" r="7" fill="none" stroke="#0f172a" strokeWidth="4" strokeDasharray="30 14" opacity=".85" />
      </svg>
      {!compact ? (
        <span className={`font-display text-lg font-bold ${dark ? 'text-white' : 'text-ink'}`}>
          <span className="text-brand-500">Flow</span>Commerce
        </span>
      ) : null}
    </span>
  );
}
