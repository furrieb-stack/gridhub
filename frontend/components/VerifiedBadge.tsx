interface VerifiedBadgeProps {
  size?: number;
  className?: string;
}

export default function VerifiedBadge({ size = 20, className }: VerifiedBadgeProps) {
  const inner = Math.round(size * 0.42);

  return (
    <div
      className={`rounded-full bg-[#FFD190] flex items-center justify-center ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
      }}
    >
      <svg width={inner} height={inner} viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="#12110f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
