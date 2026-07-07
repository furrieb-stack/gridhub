export default function Stories() {
  const items = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    username: i === 0 ? "Your story" : `user_${i}`,
    avatar: null,
    seen: i > 4,
  }));

  return (
    <div className="flex items-center gap-5 overflow-x-auto py-4 px-1 no-scrollbar">
      {items.map((item) => (
        <button key={item.id} className="flex flex-col items-center gap-1.5 shrink-0 group">
          <div className="relative">
            <div
              className={`w-[68px] h-[68px] rounded-full ${
                item.seen
                  ? "ring-2 ring-white/10 ring-offset-[3px] ring-offset-[#12110f]"
                  : "ring-2 ring-white/70 ring-offset-[3px] ring-offset-[#12110f]"
              }`}
            >
              <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                {item.id === 0 ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                ) : (
                  <span className="text-white/30 text-[22px] font-bold">
                    {item.username.slice(-1).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            {!item.seen && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FFD190] border-2 border-[#12110f]" />
            )}
          </div>
          <span className="text-[11px] text-white/40 truncate max-w-[72px]">
            {item.username}
          </span>
        </button>
      ))}
    </div>
  );
}
