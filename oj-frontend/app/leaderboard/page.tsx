import { fetchLeaderboard } from "@/lib/api";
import Link from "next/link";

export default async function Leaderboard() {
  const leaderboard = await fetchLeaderboard();

  const rankLabel = (index: number) => {
    if (index === 0) return "01";
    if (index === 1) return "02";
    if (index === 2) return "03";
    return `${String(index + 1).padStart(2, "0")}`;
  };

  const rankColor = (index: number) => {
    if (index === 0) return "text-amber-400";
    if (index === 1) return "text-neutral-400";
    if (index === 2) return "text-amber-700";
    return "text-neutral-800";
  };

  return (
    <div className="mx-auto max-w-screen-xl px-8 py-14">

      <div className="mb-10">
        <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700 block mb-3">
          Rankings
        </span>
        <h1 className="font-sans text-[32px] font-bold tracking-[-0.035em] text-white leading-none mb-2">
          Leaderboard
        </h1>
        <p className="font-mono-custom text-[11px] text-neutral-700">
          Top solvers ranked by problems solved
        </p>
      </div>

      <div className="border border-neutral-800/60 rounded-lg overflow-hidden">

        <div className="grid grid-cols-[64px_1fr_100px] gap-4 px-5 py-3 bg-[#0d0d0d] border-b border-neutral-800/60">
          <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">Rank</span>
          <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">Username</span>
          <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700 text-right">Solved</span>
        </div>

        <div className="divide-y divide-neutral-800/40">
          {leaderboard.map((user: { username: string; solvedCount: number }, index: number) => (
            <div
              key={user.username}
              className="grid grid-cols-[64px_1fr_100px] gap-4 px-5 py-3.5 items-center hover:bg-neutral-800/20 transition-colors duration-150 group"
            >
              <span className={`font-mono-custom text-[13px] font-medium tabular-nums ${rankColor(index)}`}>
                {rankLabel(index)}
              </span>
              <Link
                href={`/user/${user.username}`}
                className="font-sans text-[13px] font-medium text-neutral-400 group-hover:text-neutral-200 transition-colors duration-150 tracking-[-0.01em] w-fit"
              >
                {user.username}
              </Link>
              <span className="font-mono-custom text-[13px] text-emerald-500 text-right tabular-nums">
                {user.solvedCount}
              </span>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-800">
                No data yet
              </span>
              <p className="font-mono-custom text-[11px] text-neutral-700">
                Be the first to solve a problem.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}