export default function Stories() {
  const items = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    username: i === 0 ? "You" : `user_${i}`,
    avatar: null,
    seen: i > 4,
  }));

  return (
    <div className="flex items-center gap-4 overflow-x-auto py-3 px-1 no-scrollbar">
      {items.map((item) => (
        <button
          key={item.id}
          className="flex flex-col items-center gap-1.5 shrink-0 group"
        >
          <div
            className={`w-16 h-16 rounded-full p-[2px] ${
              item.seen
                ? "border-2 border-border"
                : "bg-gradient-to-tr from-yellow to-orange-400"
            }`}
          >
            <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden">
              {item.id === 0 ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeLinecap="round" />
                </svg>
              ) : (
                <span className="text-white/40 text-[18px] font-bold">
                  {item.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <span className="text-[11px] text-muted truncate max-w-[68px]">
            {item.username}
          </span>
        </button>
      ))}
    </div>
  );
}
