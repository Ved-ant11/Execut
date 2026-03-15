"use client";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAuthStatus, getBattleHistory } from "@/lib/api";

type BattleHistoryEntry = {
  id: string;
  status: string;
  won: boolean;
  draw: boolean;
  opponent: string;
  opponentRating: number;
  question: { id: string; title: string; difficulty: string };
  timeTaken: number | null;
  createdAt: string;
  endedAt: string | null;
};

export default function Battle() {
  const router = useRouter();
  const { searching, battleId, startSearching, cancelSearching } = useMatchmaking();
  const [authStatus, setAuthStatus] = useState<{ isLoggedIn: boolean; userId: string | null }>({ isLoggedIn: false, userId: null });
  const [stats, setStats]   = useState({ rating: 1200, battlesPlayed: 0, battlesWon: 0 });
  const [history, setHistory] = useState<BattleHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const status = await fetchAuthStatus();
        if (status && status.username) {
          setAuthStatus({ isLoggedIn: true, userId: status.username });
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"}/user/me`,
            { credentials: "include" }
          );
          if (res.ok) {
            const userData = await res.json();
            setStats({ rating: userData.rating || 1200, battlesPlayed: userData.battlesPlayed || 0, battlesWon: userData.battlesWon || 0 });
          }
          try {
            const battles = await getBattleHistory();
            setHistory(battles);
          } catch (err) { console.error("Failed to fetch battle history", err); }
        }
      } catch (err) { console.error("Failed to fetch user data", err); }
      finally { setLoading(false); }
    };
    checkAuth();
  }, []);

  useEffect(() => { if (battleId) router.push(`/battle/${battleId}`); }, [battleId, router]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (d < 7)  return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const difficultyColor = (d: string) => {
    switch (d?.toUpperCase()) {
      case "EASY":   return "text-emerald-500";
      case "MEDIUM": return "text-amber-500";
      case "HARD":   return "text-red-500";
      default:       return "text-neutral-600";
    }
  };

  const winRate = stats.battlesPlayed > 0 ? Math.round((stats.battlesWon / stats.battlesPlayed) * 100) : 0;

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3rem)] items-center justify-center bg-[#0a0a0a]">
        <svg className="h-5 w-5 animate-spin text-neutral-700" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (!authStatus.isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3rem)] bg-[#0a0a0a] px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 mx-auto mb-8 border border-neutral-800/60 rounded-lg bg-[#0d0d0d] flex items-center justify-center">
            <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="font-sans text-[22px] font-bold tracking-[-0.035em] text-white mb-2">
            Sign in to battle
          </h2>
          <p className="font-mono-custom text-[11px] text-neutral-700 mb-10 leading-relaxed">
            Log in to compete against other coders in real-time.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full h-11 rounded-md bg-white font-mono-custom text-[11px] tracking-[0.14em] uppercase font-medium text-neutral-900 hover:bg-neutral-200 transition-colors duration-200"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-[#0a0a0a]">
      <div className="max-w-screen-xl mx-auto px-8 py-14">
        <div className="max-w-2xl">
          <div className="mb-12">
            <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700 block mb-3">
              Arena
            </span>
            <h1 className="font-sans text-[32px] font-bold tracking-[-0.035em] text-white leading-none mb-2">
              Battle
            </h1>
            <p className="font-mono-custom text-[11px] text-neutral-700">
              Compete head-to-head. First to solve wins.
            </p>
          </div>
          <div className="grid grid-cols-3 border border-neutral-800/60 rounded-lg overflow-hidden mb-12">
            {[
              { label: "Rating",   value: stats.rating,       suffix: ""  },
              { label: "Battles",  value: stats.battlesPlayed, suffix: "" },
              { label: "Win Rate", value: winRate,             suffix: "%" },
            ].map((s, i) => (
              <div key={s.label} className={`bg-[#0d0d0d] px-6 py-5 ${i !== 0 ? "border-l border-neutral-800/60" : ""}`}>
                <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700 block mb-2.5">
                  {s.label}
                </span>
                <span className="font-sans text-[28px] font-bold tracking-[-0.04em] text-white leading-none tabular-nums">
                  {s.value}
                  {s.suffix && <span className="text-[16px] font-medium text-neutral-600 ml-0.5">{s.suffix}</span>}
                </span>
              </div>
            ))}
          </div>
          <div className="mb-14">
            {searching ? (
              <div className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] flex flex-col items-center py-14 gap-5">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full bg-neutral-700/10 animate-ping" />
                  <div className="relative w-12 h-12 rounded-md border border-neutral-800/60 bg-[#111111] flex items-center justify-center">
                    <svg className="w-4 h-4 animate-spin text-neutral-500" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-sans text-[14px] font-semibold text-neutral-300 tracking-[-0.01em] mb-1">
                    Searching for opponent
                  </p>
                  <p className="font-mono-custom text-[10px] text-neutral-700">
                    This usually takes a few seconds
                  </p>
                </div>
                <button
                  onClick={cancelSearching}
                  className="font-mono-custom text-[10px] tracking-[0.18em] uppercase text-neutral-700 hover:text-neutral-400 border-b border-neutral-800 hover:border-neutral-600 pb-px transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={startSearching}
                className="w-full h-12 rounded-md bg-white font-mono-custom text-[11px] tracking-[0.14em] uppercase font-medium text-neutral-900 hover:bg-neutral-200 transition-colors duration-200 flex items-center justify-center gap-2.5 active:scale-[0.99]"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Find Match
              </button>
            )}
          </div>
          <div>
            <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700 block mb-5">
              Recent Battles
            </span>

            {history.length === 0 ? (
              <div className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] py-16 flex flex-col items-center gap-3">
                <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-800">
                  No battles yet
                </span>
                <p className="font-mono-custom text-[11px] text-neutral-700">
                  Find a match to get started.
                </p>
              </div>
            ) : (
              <div className="border border-neutral-800/60 rounded-lg overflow-hidden">
                <div className="divide-y divide-neutral-800/40">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => router.push(`/battle/${entry.id}`)}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-800/20 transition-colors duration-150 cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          entry.won ? "bg-emerald-500" : entry.draw ? "bg-amber-500" : "bg-red-500"
                        }`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5 mb-0.5">
                            <span className="font-sans text-[13px] font-medium text-neutral-400 group-hover:text-neutral-200 transition-colors duration-150 truncate tracking-[-0.01em]">
                              {entry.question.title}
                            </span>
                            <span className={`font-mono-custom text-[9px] tracking-[0.15em] uppercase shrink-0 ${difficultyColor(entry.question.difficulty)}`}>
                              {entry.question.difficulty}
                            </span>
                          </div>
                          <div className="font-mono-custom text-[10px] text-neutral-700 flex items-center gap-1.5">
                            <span>vs</span>
                            <span
                              className="hover:text-neutral-400 transition-colors duration-150 cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); router.push(`/user/${entry.opponent}`); }}
                            >
                              {entry.opponent}
                            </span>
                            <span className="text-neutral-800">·</span>
                            <span className="text-neutral-800">{entry.opponentRating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 shrink-0">
                        {entry.timeTaken && (
                          <span className="font-mono-custom text-[10px] text-neutral-700 tabular-nums">
                            {formatTime(entry.timeTaken)}
                          </span>
                        )}
                        <span className="font-mono-custom text-[10px] text-neutral-700 tabular-nums w-14 text-right">
                          {formatDate(entry.createdAt)}
                        </span>
                        <svg className="w-3 h-3 text-neutral-800 group-hover:text-neutral-600 transition-colors duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}