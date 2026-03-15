"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchProfile, fetchStreakData } from "@/lib/api";
import Link from "next/link";
import { ActivityCalendar } from "react-activity-calendar";
import { Flame, Trophy } from "lucide-react";

interface Submission {
  id: string;
  language: string;
  verdict: string | null;
  createdAt: string;
  question: { id: string; title: string };
}

interface Profile {
  username: string;
  email: string;
  createdAt: string;
  submissions: Submission[];
  rating: number;
  battlesPlayed: number;
  battlesWon: number;
}

interface StreakData {
  currentStreak: number;
  maxStreak: number;
  heatmapData: Array<{ date: string; count: number }>;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, streakRes] = await Promise.all([
          fetchProfile(),
          fetchStreakData(),
        ]);
        setProfile(profileData);
        setStreakData(streakRes);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [router]);

  const generateCalendarData = (heatmapData: { date: string; count: number }[]) => {
    const map = new Map(heatmapData.map((d) => [d.date, d.count]));
    const today = new Date();
    const yearAgo = new Date();
    yearAgo.setFullYear(today.getFullYear() - 1);
    const data = [];
    for (let d = new Date(yearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const count = map.get(dateStr) || 0;
      data.push({ date: dateStr, count, level: count === 0 ? 0 : Math.min(count, 4) });
    }
    return data;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3rem)]">
        <svg className="h-5 w-5 animate-spin text-neutral-700" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (!profile) return null;

  const totalSubmissions = profile.submissions.length;
  const accepted = profile.submissions.filter((s) => s.verdict === "AC").length;
  const successRate = totalSubmissions > 0 ? ((accepted / totalSubmissions) * 100).toFixed(1) : "0";
  const winRate = profile.battlesPlayed > 0 ? Math.round((profile.battlesWon / profile.battlesPlayed) * 100) : 0;

  const verdictColor: Record<string, string> = {
    AC:  "text-emerald-500",
    WA:  "text-red-500",
    TLE: "text-amber-500",
    RTE: "text-amber-500",
    CE:  "text-amber-500",
  };

  const verdictLabel: Record<string, string> = {
    AC:  "Accepted",
    WA:  "Wrong Answer",
    TLE: "Time Limit Exceeded",
    RTE: "Runtime Error",
    CE:  "Compilation Error",
  };

  const successRateColor =
    parseFloat(successRate) < 25 ? "text-red-500" :
    parseFloat(successRate) <= 60 ? "text-amber-500" : "text-emerald-500";

  const winRateColor =
    winRate < 25 ? "text-red-500" :
    winRate <= 60 ? "text-amber-500" : "text-emerald-500";

  return (
    <div className="mx-auto max-w-screen-xl px-8 py-14">
      <div className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] p-7 mb-4">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-neutral-800 font-sans text-[22px] font-bold text-neutral-300 tracking-[-0.04em]">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-sans text-[22px] font-bold tracking-[-0.035em] text-white leading-none mb-1.5">
              {profile.username}
            </h1>
            <p className="font-mono-custom text-[10px] text-neutral-600">{profile.email}</p>
            <p className="font-mono-custom text-[10px] text-neutral-800 mt-1">
              Member since{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[
          { value: totalSubmissions, label: "Submissions",    color: "text-white"          },
          { value: accepted,         label: "Accepted",       color: "text-emerald-500"    },
          { value: `${successRate}%`,label: "Success Rate",   color: successRateColor      },
          { value: profile.rating,   label: "Battle Rating",  color: "text-white"          },
          { value: `${winRate}%`,    label: "Win Rate",       color: winRateColor          },
        ].map((s) => (
          <div key={s.label} className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] p-5">
            <p className={`font-sans text-[28px] font-bold tracking-[-0.04em] leading-none ${s.color}`}>
              {s.value}
            </p>
            <p className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700 mt-2.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>
      {streakData && (
        <div className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] p-7 mb-4 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700">
              Activity
            </span>
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="w-full lg:flex-1 overflow-x-auto">
              <div className="w-max flex flex-row-reverse">
                <ActivityCalendar
                  data={generateCalendarData(streakData.heatmapData)}
                  theme={{
                    light: ["#1a1a1a", "#064e3b", "#047857", "#059669", "#10b981"],
                    dark:  ["#1a1a1a", "#064e3b", "#047857", "#059669", "#10b981"],
                  }}
                  colorScheme="dark"
                  labels={{ totalCount: "{{count}} submissions in the last year" }}
                  blockSize={12}
                  blockMargin={4}
                  fontSize={11}
                />
              </div>
            </div>
            <div className="flex items-center gap-10 lg:border-l lg:border-neutral-800/60 lg:pl-10">
              <div className="flex flex-col items-center gap-3">
                <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">
                  Current Streak
                </span>
                <div className="flex items-center gap-2">
                  <Flame className="h-7 w-7 text-amber-500 fill-amber-500" />
                  <span className="font-sans text-[32px] font-bold tracking-[-0.04em] text-white leading-none">
                    {streakData.currentStreak}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">
                  Longest Streak
                </span>
                <div className="flex items-center gap-2">
                  <Trophy className="h-7 w-7 text-amber-500 fill-amber-500" />
                  <span className="font-sans text-[32px] font-bold tracking-[-0.04em] text-white leading-none">
                    {streakData.maxStreak}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-5">
          <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700">
            Recent Submissions
          </span>
        </div>

        {totalSubmissions === 0 ? (
          <div className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] py-16 flex flex-col items-center gap-4">
            <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-800">
              No submissions yet
            </span>
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 font-mono-custom text-[10px] tracking-[0.18em] uppercase text-neutral-600 hover:text-neutral-300 transition-colors duration-200 border-b border-neutral-800 hover:border-neutral-600 pb-px"
            >
              Browse Problems →
            </Link>
          </div>
        ) : (
          <div className="border border-neutral-800/60 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_160px_100px] gap-4 px-5 py-3 bg-[#0d0d0d] border-b border-neutral-800/60">
              <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">Problem</span>
              <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">Language</span>
              <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">Verdict</span>
              <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700 text-right">Date</span>
            </div>
            <div className="divide-y divide-neutral-800/40">
              {profile.submissions
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((submission) => (
                  <Link
                    key={submission.id}
                    href={`/problems/${submission.question.id}`}
                    className="grid grid-cols-[1fr_100px_160px_100px] gap-4 px-5 py-3.5 items-center hover:bg-neutral-800/20 transition-colors duration-150 group"
                  >
                    <span className="font-sans text-[13px] font-medium text-neutral-400 group-hover:text-neutral-200 transition-colors duration-150 truncate tracking-[-0.01em]">
                      {submission.question.title}
                    </span>
                    <span className="font-mono-custom text-[10px] tracking-[0.1em] uppercase text-neutral-600">
                      {submission.language}
                    </span>
                    <span className={`font-mono-custom text-[10px] tracking-[0.1em] font-medium ${verdictColor[submission.verdict || ""] || "text-neutral-600"}`}>
                      {submission.verdict ? (verdictLabel[submission.verdict] || submission.verdict) : "Pending"}
                    </span>
                    <span className="font-mono-custom text-[10px] text-neutral-700 text-right tabular-nums">
                      {new Date(submission.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}