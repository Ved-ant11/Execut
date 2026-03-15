"use client";
import { useEffect, useState } from "react";
import { fetchPublicProfile, fetchAuthStatus } from "@/lib/api";
import Link from "next/link";
import { ActivityCalendar } from "react-activity-calendar";
import { useParams } from "next/navigation";
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

interface StreakData {
  currentStreak: number;
  maxStreak: number;
  heatmapData: Array<{ date: string; count: number }>;
}

interface PublicProfile {
  username: string;
  rating: number;
  battlesPlayed: number;
  battlesWon: number;
  createdAt: string;
  solvedCount: number;
  submissions: Submission[];
  streakData: StreakData;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPublicProfile(username);
        setProfile(data);

        const authStatus = await fetchAuthStatus();
        if (authStatus && authStatus.username === username) {
          setIsCurrentUser(true);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load profile");
        }
      } finally {
        setLoading(false);
      }
    };
    if (username) {
      loadData();
    }
  }, [username]);

  const generateCalendarData = (
    heatmapData: { date: string; count: number }[]
  ) => {
    const map = new Map(heatmapData.map((d) => [d.date, d.count]));
    const today = new Date();
    const yearAgo = new Date();
    yearAgo.setFullYear(today.getFullYear() - 1);
    const data = [];
    for (let d = new Date(yearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const count = map.get(dateStr) || 0;
      data.push({
        date: dateStr,
        count,
        level: count === 0 ? 0 : Math.min(count, 4),
      });
    }
    return data;
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#0a0a0a]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-700 border-t-neutral-300" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#0a0a0a] px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800/80">
            <svg
              className="h-5 w-5 text-neutral-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-white">
            {error === "User not found" ? "User Not Found" : "Error Loading Profile"}
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-neutral-500">
            {error === "User not found"
              ? "The user you are looking for does not exist or has been deleted."
              : "There was a problem loading this profile. Please try again."}
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const totalSubmissions = profile.submissions.length;
  const accepted = profile.submissions.filter((s) => s.verdict === "AC").length;
  const successRate =
    totalSubmissions > 0
      ? ((accepted / totalSubmissions) * 100).toFixed(1)
      : "0";

  const winRate =
    profile.battlesPlayed > 0
      ? Math.round((profile.battlesWon / profile.battlesPlayed) * 100)
      : 0;

  const verdictColor: Record<string, string> = {
    AC: "text-emerald-400",
    WA: "text-red-400",
    TLE: "text-amber-400",
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
    <div className="min-h-[calc(100vh-4rem)] bg-[#0a0a0a]">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800 text-2xl font-bold text-neutral-100">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
                  {profile.username}
                </h1>
                {isCurrentUser && (
                  <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-medium tracking-wider text-neutral-400">
                    You
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Joined{" "}
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
              </p>
            </div>
          </div>
          {isCurrentUser && (
            <Link
              href="/profile"
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-700"
            >
              Edit Profile
            </Link>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
            <p className="text-2xl font-bold tabular-nums text-neutral-100">
              {profile.solvedCount}
            </p>
            <p className="mt-1 text-xs font-medium tracking-wide text-neutral-500">
              Total Solved
            </p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
            <p className={`text-2xl font-bold tabular-nums ${
              parseFloat(successRate) < 25 ? "text-rose-400" : parseFloat(successRate) <= 60 ? "text-orange-400" : "text-emerald-400"
            }`}>
              {successRate}%
            </p>
            <p className="mt-1 text-xs font-medium tracking-wide text-neutral-500">
              Success Rate
            </p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
            <p className="text-2xl font-bold tabular-nums text-neutral-100">
              {profile.rating}
            </p>
            <p className="mt-1 text-xs font-medium tracking-wide text-neutral-500">
              Battle Rating
            </p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
            <p className={`text-2xl font-bold tabular-nums ${
              winRate < 25 ? "text-rose-400" : winRate <= 60 ? "text-orange-400" : "text-emerald-400"
            }`}>
              {winRate}%
            </p>
            <p className="mt-1 text-xs font-medium tracking-wide text-neutral-500">
              Win Rate
            </p>
          </div>
        </div>

        {profile.streakData && (
          <div className="mt-8 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
            <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
              <div className="w-full pb-4 lg:flex-1 overflow-x-auto">
                <div className="flex min-w-max flex-row-reverse pr-4">
                  <ActivityCalendar
                    data={generateCalendarData(profile.streakData.heatmapData)}
                    theme={{
                      light: [
                        "#262626",
                        "#10b981",
                        "#059669",
                        "#047857",
                        "#064e3b",
                      ],
                      dark: [
                        "#171717",
                        "#064e3b",
                        "#047857",
                        "#059669",
                        "#10b981",
                      ],
                    }}
                    colorScheme="dark"
                    labels={{
                      totalCount: "{{count}} submissions in the last year",
                    }}
                    blockSize={12}
                    blockMargin={4}
                    fontSize={12}
                  />
                </div>
              </div>
              <div className="flex items-center gap-8 lg:h-[100px] lg:border-l lg:border-neutral-800 lg:pl-8">
                <div className="text-center">
                  <p className="text-xs font-medium tracking-wide text-neutral-500">
                    Current Streak
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Flame className="h-8 w-8 text-orange-500 fill-orange-500 animate-pulse" />
                    <span className="text-3xl font-bold text-neutral-100">
                      {profile.streakData.currentStreak}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium tracking-wide text-neutral-500">
                    Longest Streak
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Trophy className="h-8 w-8 text-yellow-500 fill-yellow-500 animate-bounce" />
                    <span className="text-3xl font-bold text-neutral-100">
                      {profile.streakData.maxStreak}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="mb-4 text-sm font-semibold text-neutral-100">
            Recent Submissions
          </h2>

          {totalSubmissions === 0 ? (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 py-12 text-center">
              <p className="text-sm text-neutral-500">No submissions yet.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-neutral-800">
              <div className="grid grid-cols-[1fr_90px_120px_100px] gap-4 border-b border-neutral-800 bg-neutral-900/60 px-4 py-2.5 text-xs font-medium tracking-wide text-neutral-500">
                <span>Problem</span>
                <span>Language</span>
                <span>Verdict</span>
                <span className="text-right">Date</span>
              </div>

              <div className="divide-y divide-neutral-800/60">
                {profile.submissions
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((submission) => (
                    <Link
                      key={submission.id}
                      href={`/problems/${submission.question.id}`}
                      className="group grid grid-cols-[1fr_90px_120px_100px] items-center gap-4 px-4 py-3 transition-colors hover:bg-neutral-800/40"
                    >
                      <span className="truncate text-sm text-neutral-300 transition-colors group-hover:text-neutral-100">
                        {submission.question.title}
                      </span>
                      <span className="text-xs capitalize text-neutral-400">
                        {submission.language}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          verdictColor[submission.verdict || ""] ||
                          "text-neutral-500"
                        }`}
                      >
                        {submission.verdict
                          ? verdictLabel[submission.verdict] ||
                            submission.verdict
                          : "Pending"}
                      </span>
                      <span className="text-right text-xs text-neutral-600">
                        {new Date(submission.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
