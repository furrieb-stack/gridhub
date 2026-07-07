export default function Stories() {
  const items = [
    { id: 0, username: "Your story", seen: true },
    { id: 1, username: "Alex M.", seen: false },
    { id: 2, username: "Sarah K.", seen: false },
    { id: 3, username: "Mike R.", seen: false },
    { id: 4, username: "Julia B.", seen: false },
    { id: 5, username: "Tom W.", seen: true },
    { id: 6, username: "Nina P.", seen: true },
    { id: 7, username: "Dan C.", seen: true },
  ];

  return (
    <div className="flex items-center gap-5 overflow-x-auto py-4 px-1 no-scrollbar">
      {items.map((item) => (
        <button key={item.id} className="flex flex-col items-center gap-2 shrink-0 group">
          <div className="relative">
            <div
              className={`w-[68px] h-[68px] rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
                item.id === 0
                  ? "border-[1.5px] border-white/20 bg-transparent"
                  : `bg-[#FFD190] ${
                      item.seen
                        ? "ring-2 ring-white/10 ring-offset-[3px] ring-offset-[#12110f] opacity-50"
                        : "ring-2 ring-white/80 ring-offset-[3px] ring-offset-[#12110f]"
                    }`
              }`}
            >
              {item.id === 0 ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="rgba(255,255,255,0.6)" strokeWidth={2} strokeLinecap="round" />
                </svg>
              ) : (
                <span className="text-[#12110f] text-[24px] font-bold">
                  {item.username.charAt(0)}
                </span>
              )}
            </div>

            {!item.seen && item.id !== 0 && (
              <div className="absolute bottom-0 right-0 w-[20px] h-[20px] rounded-full bg-[#FFD190] border-[3px] border-[#12110f]" />
            )}
          </div>
          
          <span className={`text-[12px] truncate max-w-[72px] mt-0.5 ${
            item.id === 0 || !item.seen ? "text-white/80" : "text-white/40"
          }`}>
            {item.username}
          </span>
        </button>
      ))}
    </div>
  );
}