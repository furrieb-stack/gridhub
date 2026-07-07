"use client";

import { useState } from "react";

const TAGS = ["#javascript", "#react", "#python", "#design", "#devops", "#ai", "#backend", "#frontend", "#rust", "#go"];

const TRENDING = [
  { tag: "#javascript", posts: "12.4K" },
  { tag: "#react", posts: "8.2K" },
  { tag: "#python", posts: "7.9K" },
  { tag: "#ai", posts: "6.1K" },
  { tag: "#devops", posts: "4.3K" },
];

type Tab = "recomendations" | "subscriptions";

export default function FeedRightSidebar() {
  const [activeTab, setActiveTab] = useState<Tab>("recomendations");

  return (
    <aside className="w-[300px] shrink-0">
      <div className="rounded-[16px] border overflow-hidden"
        style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
      >
        <div className="flex border-b" style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}>
          <button
            onClick={() => setActiveTab("recomendations")}
            className="flex-1 py-3 text-[13px] font-medium transition-colors duration-200 relative"
            style={{
              color: activeTab === "recomendations" ? "#FFD190" : "rgba(255,255,255,0.5)",
            }}
          >
            Recomendations
            {activeTab === "recomendations" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-yellow" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className="flex-1 py-3 text-[13px] font-medium transition-colors duration-200 relative"
            style={{
              color: activeTab === "subscriptions" ? "#FFD190" : "rgba(255,255,255,0.5)",
            }}
          >
            Subscriptions
            {activeTab === "subscriptions" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-yellow" />
            )}
          </button>
        </div>

        <div className="p-3">
          {activeTab === "recomendations" ? (
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  className="px-3 py-1.5 rounded-[8px] text-[12px] text-muted hover:text-white hover:bg-white/[0.04] transition-all duration-200"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                >
                  {tag}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-muted text-[13px] text-center py-4">
              Subscribe to subgrids to see them here
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-[16px] border p-4"
        style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
      >
        <h3 className="text-white text-[14px] font-bold mb-3">Trending</h3>
        <div className="flex flex-col gap-3">
          {TRENDING.map((item, i) => (
            <button
              key={item.tag}
              className="flex items-center gap-3 group"
            >
              <span className="text-muted-dark text-[12px] w-4 shrink-0">{i + 1}</span>
              <div className="text-left">
                <p className="text-[13px] text-white group-hover:text-yellow transition-colors">{item.tag}</p>
                <p className="text-[11px] text-muted-dark">{item.posts} posts</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
