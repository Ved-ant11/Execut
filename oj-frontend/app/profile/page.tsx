"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchProfile, fetchStreakData } from "@/lib/api";
import Link from "next/link";
import {ActivityCalendar} from 'react-activity-calendar';
import { Flame, Trophy } from "lucide-react";

interface Submission {
  id: string;
  language: string;
  verdict: string | null;
  createdAt: string;
  question: {
    id: string;
    title: string;
  };
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
          fetchStreakData()
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

  const generateCalendarData = (heatmapData: { date: string, count: number }[]) => {
    const map = new Map(heatmapData.map(d => [d.date, d.count]));
    const today = new Date();
    const yearAgo = new Date();
    yearAgo.setFullYear(today.getFullYear() - 1);
    const data = [];
    for (let d = new Date(yearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const count = map.get(dateStr) || 0;
      data.push({
        date: dateStr,
        count,
        level: count === 0 ? 0 : Math.min(count, 4)
      });
    }
    return data;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3rem)]">
        <svg className="h-6 w-6 animate-spin text-neutral-500" viewBox="0 0 24 24" fill="none">
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

  const winRate =
    profile.battlesPlayed > 0
      ? Math.round((profile.battlesWon / profile.battlesPlayed) * 100)
      : 0;

  const verdictColor: Record<string, string> = {
    AC: "text-emerald-400",
    WA: "text-red-400",
    TLE: "text-yellow-400",
    RTE: "text-orange-400",
    CE: "text-orange-400",
  };

  const verdictLabel: Record<string, string> = {
    AC: "Accepted",
    WA: "Wrong Answer",
    TLE: "Time Limit Exceeded",
    RTE: "Runtime Error",
    CE: "Compilation Error",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 text-xl font-bold text-neutral-100">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-100">
              {profile.username}
            </h1>
            <p className="text-sm text-neutral-500">{profile.email}</p>
            <p className="text-xs text-neutral-600 mt-0.5">
              Member since{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
          <p className="text-2xl font-bold text-neutral-100">{totalSubmissions}</p>
          <p className="text-xs font-medium text-neutral-500 tracking-wide mt-1">
            Submissions
          </p>
        </div>
        <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4">
          <p className="text-2xl font-bold text-emerald-400">{accepted}</p>
          <p className="text-xs font-medium text-emerald-500/70 tracking-wide mt-1">
            Accepted
          </p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
          <p className={`text-2xl font-bold ${
            parseFloat(successRate) < 25 ? "text-rose-400" : parseFloat(successRate) <= 60 ? "text-orange-400" : "text-emerald-400"
          }`}>
            {successRate}%
          </p>
          <p className="text-xs font-medium text-neutral-500 tracking-wide mt-1">
            Success Rate
          </p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
          <p className="text-2xl font-bold text-neutral-100">{profile.rating}</p>
          <p className="text-xs font-medium text-neutral-500 tracking-wide mt-1">
            Battle Rating
          </p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
          <p className={`text-2xl font-bold ${
            winRate < 25 ? "text-rose-400" : winRate <= 60 ? "text-orange-400" : "text-emerald-400"
          }`}>
            {winRate}%
          </p>
          <p className="text-xs font-medium text-neutral-500 tracking-wide mt-1">
            Win Rate
          </p>
        </div>
      </div>

      {streakData && (
        <div className="mt-8 rounded-lg border border-neutral-800 bg-neutral-900/60 p-6 overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="w-full lg:flex-1 overflow-x-auto pb-4">
              <div className="w-max pr-4 flex flex-row-reverse">
                <ActivityCalendar 
                  data={generateCalendarData(streakData.heatmapData)} 
                  theme={{
                    light: ['#262626', '#10b981', '#059669', '#047857', '#064e3b'],
                    dark: ['#171717', '#064e3b', '#047857', '#059669', '#10b981']
                  }}
                  colorScheme="dark"
                  labels={{
                    totalCount: '{{count}} submissions in the last year',
                  }}
                  blockSize={12}
                  blockMargin={4}
                  fontSize={12}
                />
              </div>
            </div>
            <div className="flex items-center gap-8 lg:border-l lg:border-neutral-800 lg:pl-8 lg:h-[100px]">
              <div className="text-center">
                <p className="text-xs font-medium text-neutral-500 tracking-wide">Current Streak</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Flame className="h-8 w-8 text-orange-500 fill-orange-500"/>
                  <span className="text-3xl font-bold text-neutral-100">{streakData.currentStreak}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-neutral-500 tracking-wide">Longest Streak</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Trophy className="h-8 w-8 text-yellow-500 fill-yellow-500"/>
                  <span className="text-3xl font-bold text-neutral-100">{streakData.maxStreak}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-100 mb-4">Recent Submissions</h2>

        {totalSubmissions === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 py-12 text-center">
            <p className="text-sm text-neutral-500">No submissions yet.</p>
            <Link
              href="/problems"
              className="inline-block mt-3 text-sm text-neutral-400 hover:text-neutral-200 transition-colors underline underline-offset-4"
            >
              Go solve some problems →
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-800 overflow-hidden">
            <div className="grid grid-cols-[1fr_90px_120px_100px] gap-4 px-4 py-2.5 bg-neutral-900/60 border-b border-neutral-800 text-xs font-medium text-neutral-500 tracking-wide">
              <span>Problem</span>
              <span>Language</span>
              <span>Verdict</span>
              <span className="text-right">Date</span>
            </div>

            <div className="divide-y divide-neutral-800/60">
              {profile.submissions
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((submission) => (
                  <Link
                    key={submission.id}
                    href={`/problems/${submission.question.id}`}
                    className="grid grid-cols-[1fr_90px_120px_100px] gap-4 px-4 py-3 items-center transition-colors hover:bg-neutral-800/40 group"
                  >
                    <span className="text-sm text-neutral-300 group-hover:text-neutral-100 transition-colors truncate">
                      {submission.question.title}
                    </span>
                    <span className="text-xs text-neutral-400 capitalize">
                      {submission.language}
                    </span>
                    <span className={`text-xs font-medium ${verdictColor[submission.verdict || ""] || "text-neutral-500"}`}>
                      {submission.verdict ? (verdictLabel[submission.verdict] || submission.verdict) : "Pending"}
                    </span>
                    <span className="text-xs text-neutral-600 text-right">
                      {new Date(submission.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
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
