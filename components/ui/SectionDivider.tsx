// Subtle, animated wave divider for section transitions
// Server component (no client JS needed)

export default function SectionDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-16 w-full ${className}`} aria-hidden>
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="sd-fade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(246,247,251,0)" />
            <stop offset="100%" stopColor="rgba(246,247,251,1)" />
          </linearGradient>
        </defs>
        <path
          d="M0,40 C240,90 480,-10 720,30 C960,70 1200,10 1440,40 L1440,120 L0,120 Z"
          fill="url(#sd-fade)"
        />
        <path
          d="M0,46 C240,96 480,-4 720,36 C960,76 1200,16 1440,46"
          fill="none"
          stroke="rgba(99,102,241,0.10)"
          strokeWidth="2"
          className="motion-safe:animate-[waveFloat_4s_ease-in-out_infinite]"
        />
      </svg>
      <style>{`
        @keyframes waveFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(2px); } }
      `}</style>
    </div>
  );
}

