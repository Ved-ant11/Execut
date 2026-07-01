"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchReviewQueue,
  fetchRetryQueue,
  fetchPracticeStats,
  fetchTopicMastery,
  submitReview,
  dismissRetry,
} from "@/lib/api";

type Tab = "review" | "retry" | "mastery";

interface ReviewCard {
  id: string;
  questionId: string;
  title: string;
  difficulty: string;
  state: number;
  reps: number;
  previews: { again: number; hard: number; good: number; easy: number };
}

interface RetryItem {
  id: string;
  questionId: string;
  title: string;
  difficulty: string;
  tags: string[];
  lastVerdict: string;
  attempts: number;
  lastAttemptAt: string;
}

interface Stats {
  totalCards: number;
  dueNow: number;
  reviewedToday: number;
  dailyLimit: number;
  remaining: number;
  mastered: number;
  learning: number;
  retryCount: number;
}

interface TopicData {
  name: string;
  total: number;
  solved: number;
  solveRate: number;
  avgStability: number;
  level: string;
}

const difficultyColor: Record<string, string> = {
  EASY: "text-emerald-500",
  MEDIUM: "text-amber-500",
  HARD: "text-red-500",
};

const verdictColor: Record<string, string> = {
  WA: "text-red-500",
  TLE: "text-amber-500",
  RTE: "text-amber-500",
  CE: "text-amber-500",
};

const verdictLabel: Record<string, string> = {
  WA: "Wrong Answer",
  TLE: "Time Limit",
  RTE: "Runtime Error",
  CE: "Compile Error",
};

const levelConfig: Record<string, { color: string; bg: string; border: string }> = {
  Beginner: { color: "text-neutral-500", bg: "bg-neutral-500/10", border: "border-neutral-800" },
  Familiar: { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  Proficient: { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  Mastered: { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
};

export default function PracticePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("review");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);
  const [retryItems, setRetryItems] = useState<RetryItem[]>([]);
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratingState, setRatingState] = useState<"idle" | "rating" | "done">("idle");
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, reviewData, retryData, topicData] = await Promise.all([
        fetchPracticeStats(),
        fetchReviewQueue(),
        fetchRetryQueue(),
        fetchTopicMastery(),
      ]);
      setStats(statsData);
      setReviewCards(reviewData.cards || []);
      setRetryItems(retryData.items || []);
      setTopics(topicData.topics || []);
      setReviewedCount(statsData.reviewedToday || 0);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (rating: string) => {
    const card = reviewCards[currentIndex];
    if (!card) return;

    setRatingState("done");
    try {
      await submitReview(card.questionId, rating);
      setReviewedCount((c) => c + 1);

      setTimeout(() => {
        if (currentIndex < reviewCards.length - 1) {
          setCurrentIndex((i) => i + 1);
          setRatingState("idle");
        } else {
          setRatingState("done");
        }
      }, 600);
    } catch (err) {
      console.error(err);
      setRatingState("idle");
    }
  };

  const handleDismissRetry = async (questionId: string) => {
    try {
      await dismissRetry(questionId);
      setRetryItems((items) => items.filter((i) => i.questionId !== questionId));
    } catch (err) {
      console.error(err);
    }
  };

  const formatInterval = (days: number) => {
    if (days === 0) return "< 1d";
    if (days < 30) return `${days}d`;
    if (days < 365) return `${Math.round(days / 30)}mo`;
    return `${(days / 365).toFixed(1)}y`;
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

  const currentCard = reviewCards[currentIndex];
  const allReviewed = currentIndex >= reviewCards.length || ratingState === "done" && !currentCard;

  return (
    <div className="mx-auto max-w-screen-xl px-8 py-14">
      {/* Header */}
      <div className="mb-10">
        <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700 block mb-3">
          Spaced Repetition
        </span>
        <h1 className="font-sans text-[32px] font-bold tracking-[-0.035em] text-white leading-none">
          Practice
        </h1>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { value: stats.dueNow, label: "Due Now", color: stats.dueNow > 0 ? "text-amber-500" : "text-neutral-500" },
            { value: `${reviewedCount}/${stats.dailyLimit}`, label: "Today", color: "text-white" },
            { value: stats.mastered, label: "Mastered", color: "text-emerald-500" },
            { value: stats.retryCount, label: "To Retry", color: stats.retryCount > 0 ? "text-red-400" : "text-neutral-500" },
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
      )}

      {/* Tab Bar */}
      <div className="flex items-center gap-1 mb-8 border border-neutral-800/60 rounded-lg p-1 bg-[#0d0d0d] w-fit">
        {(
          [
            { id: "review" as Tab, label: "Review", count: reviewCards.length },
            { id: "retry" as Tab, label: "Retry", count: retryItems.length },
            { id: "mastery" as Tab, label: "Topic Mastery", count: null },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`font-mono-custom text-[10px] tracking-[0.14em] uppercase px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 ${
              tab === t.id
                ? "bg-neutral-800 text-white"
                : "text-neutral-600 hover:text-neutral-300"
            }`}
          >
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                tab === t.id ? "bg-neutral-700 text-neutral-300" : "bg-neutral-800/60 text-neutral-600"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "review" && (
        <div>
          {reviewCards.length === 0 ? (
            <div className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] py-20 flex flex-col items-center gap-4">
              <div className="text-[40px]">🎉</div>
              <span className="font-mono-custom text-[11px] text-neutral-500">
                All caught up! No reviews due right now.
              </span>
              <Link
                href="/problems"
                className="inline-flex items-center gap-2 font-mono-custom text-[10px] tracking-[0.18em] uppercase text-neutral-600 hover:text-neutral-300 transition-colors duration-200 border-b border-neutral-800 hover:border-neutral-600 pb-px mt-2"
              >
                Solve more problems →
              </Link>
            </div>
          ) : allReviewed ? (
            <div className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] py-20 flex flex-col items-center gap-4">
              <div className="text-[40px]">✅</div>
              <span className="font-sans text-[16px] font-semibold text-neutral-300">
                Session complete!
              </span>
              <span className="font-mono-custom text-[11px] text-neutral-600">
                You reviewed {Math.min(currentIndex + 1, reviewCards.length)} card{currentIndex > 0 ? "s" : ""} today.
              </span>
            </div>
          ) : currentCard ? (
            <div>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-custom text-[9px] tracking-[0.18em] uppercase text-neutral-700">
                    Progress
                  </span>
                  <span className="font-mono-custom text-[11px] text-neutral-600 tabular-nums">
                    {currentIndex + 1} / {reviewCards.length}
                  </span>
                </div>
                <div className="h-px bg-neutral-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-emerald-500/60 rounded transition-all duration-500"
                    style={{ width: `${((currentIndex) / reviewCards.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Card */}
              <div className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-800/60">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`font-mono-custom text-[10px] tracking-[0.15em] uppercase font-medium ${difficultyColor[currentCard.difficulty] || "text-neutral-600"}`}>
                      {currentCard.difficulty}
                    </span>
                    <span className="font-mono-custom text-[9px] text-neutral-700">
                      {currentCard.reps > 0 ? `Review #${currentCard.reps + 1}` : "First review"}
                    </span>
                  </div>
                  <h2 className="font-sans text-[20px] font-bold text-white tracking-[-0.02em]">
                    {currentCard.title}
                  </h2>
                  <p className="font-mono-custom text-[11px] text-neutral-600 mt-3">
                    Re-solve this problem to reinforce your understanding, then rate your confidence below.
                  </p>
                </div>

                <div className="px-6 py-5">
                  <Link
                    href={`/problems/${currentCard.questionId}`}
                    className="inline-flex items-center gap-2.5 h-10 px-6 bg-white text-[#0a0a0a] rounded-md font-mono-custom text-[11px] tracking-[0.12em] uppercase font-medium hover:bg-neutral-200 transition-colors duration-200"
                  >
                    Solve Problem
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>

                {/* Rating Section */}
                <div className="px-6 py-5 border-t border-neutral-800/60 bg-[#0b0b0b]">
                  <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700 block mb-4">
                    How well did you recall the solution?
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: "again", label: "Again", sub: formatInterval(currentCard.previews.again), color: "hover:border-red-500/50 hover:text-red-400" },
                      { key: "hard", label: "Hard", sub: formatInterval(currentCard.previews.hard), color: "hover:border-amber-500/50 hover:text-amber-400" },
                      { key: "good", label: "Good", sub: formatInterval(currentCard.previews.good), color: "hover:border-blue-400/50 hover:text-blue-400" },
                      { key: "easy", label: "Easy", sub: formatInterval(currentCard.previews.easy), color: "hover:border-emerald-500/50 hover:text-emerald-400" },
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => handleRate(btn.key)}
                        disabled={ratingState !== "idle"}
                        className={`border border-neutral-800 rounded-lg px-4 py-3 flex flex-col items-center gap-1 transition-all duration-200 ${btn.color} disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <span className="font-mono-custom text-[11px] font-medium text-neutral-400">
                          {btn.label}
                        </span>
                        <span className="font-mono-custom text-[9px] text-neutral-700">
                          {btn.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {tab === "retry" && (
        <div>
          {retryItems.length === 0 ? (
            <div className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] py-20 flex flex-col items-center gap-4">
              <span className="font-mono-custom text-[11px] text-neutral-500">
                No failed problems to retry.
              </span>
              <Link
                href="/problems"
                className="inline-flex items-center gap-2 font-mono-custom text-[10px] tracking-[0.18em] uppercase text-neutral-600 hover:text-neutral-300 transition-colors duration-200 border-b border-neutral-800 hover:border-neutral-600 pb-px mt-2"
              >
                Browse problems →
              </Link>
            </div>
          ) : (
            <div className="border border-neutral-800/60 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_120px_100px_80px_60px] gap-4 px-5 py-3 bg-[#0d0d0d] border-b border-neutral-800/60">
                <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">Problem</span>
                <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">Verdict</span>
                <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">Attempts</span>
                <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">Difficulty</span>
                <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700"></span>
              </div>
              <div className="divide-y divide-neutral-800/40">
                {retryItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_120px_100px_80px_60px] gap-4 px-5 py-3.5 items-center group"
                  >
                    <Link
                      href={`/problems/${item.questionId}`}
                      className="font-sans text-[13px] font-medium text-neutral-400 hover:text-neutral-200 transition-colors duration-150 truncate tracking-[-0.01em]"
                    >
                      {item.title}
                    </Link>
                    <span className={`font-mono-custom text-[10px] tracking-[0.1em] font-medium ${verdictColor[item.lastVerdict] || "text-neutral-600"}`}>
                      {verdictLabel[item.lastVerdict] || item.lastVerdict}
                    </span>
                    <span className="font-mono-custom text-[11px] text-neutral-600 tabular-nums">
                      {item.attempts}
                    </span>
                    <span className={`font-mono-custom text-[10px] tracking-[0.15em] uppercase font-medium ${difficultyColor[item.difficulty] || "text-neutral-600"}`}>
                      {item.difficulty}
                    </span>
                    <button
                      onClick={() => handleDismissRetry(item.questionId)}
                      className="font-mono-custom text-[9px] text-neutral-700 hover:text-red-400 transition-colors duration-200"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "mastery" && (
        <div>
          {topics.length === 0 ? (
            <div className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] py-20 flex flex-col items-center gap-4">
              <span className="font-mono-custom text-[11px] text-neutral-500">
                No topic data available yet. Solve some problems first!
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {topics.map((topic) => {
                const config = levelConfig[topic.level] || levelConfig.Beginner;
                return (
                  <div
                    key={topic.name}
                    className={`border ${config.border} rounded-lg bg-[#0d0d0d] p-5 transition-colors duration-200 hover:border-neutral-700`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-sans text-[14px] font-semibold text-neutral-300 tracking-[-0.01em]">
                        {topic.name}
                      </h3>
                      <span className={`font-mono-custom text-[9px] tracking-[0.15em] uppercase ${config.color} ${config.bg} px-2 py-0.5 rounded-full`}>
                        {topic.level}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono-custom text-[8.5px] tracking-[0.15em] uppercase text-neutral-800">
                            Solved
                          </span>
                          <span className="font-mono-custom text-[11px] text-neutral-500 tabular-nums">
                            {topic.solved} <span className="text-neutral-700">/ {topic.total}</span>
                          </span>
                        </div>
                        <div className="h-1 bg-neutral-800 rounded overflow-hidden">
                          <div
                            className={`h-full rounded transition-all duration-500 ${
                              topic.level === "Mastered"
                                ? "bg-emerald-500/70"
                                : topic.level === "Proficient"
                                  ? "bg-blue-400/70"
                                  : topic.level === "Familiar"
                                    ? "bg-amber-500/70"
                                    : "bg-neutral-600/50"
                            }`}
                            style={{ width: `${topic.solveRate}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-mono-custom text-[8.5px] tracking-[0.15em] uppercase text-neutral-800">
                          Retention
                        </span>
                        <span className="font-mono-custom text-[10px] text-neutral-600">
                          {topic.avgStability > 0 ? `${topic.avgStability}d stability` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
