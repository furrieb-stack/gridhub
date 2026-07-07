interface AvatarProps {
  src?: string | null;
  username: string;
  displayName?: string | null;
  size?: number;
  className?: string;
}

export default function Avatar({ src, username, displayName, size = 42, className }: AvatarProps) {
  const label = (displayName ?? username).charAt(0).toUpperCase();

  if (src) {
    return (
      <div
        className={`rounded-full overflow-hidden shrink-0 ${className ?? ""}`}
        style={{ width: size, height: size, minWidth: size }}
      >
        <img
          src={src}
          alt={username}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full bg-[#FFD190] flex items-center justify-center shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      <span
        className="font-bold text-[#12110f]"
        style={{ fontSize: Math.max(size * 0.4, 12) }}
      >
        {label}
      </span>
    </div>
  );
}
