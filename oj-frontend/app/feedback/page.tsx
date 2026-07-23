"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { fetchFeedback, submitFeedback, fetchAuthStatus, deleteFeedback } from "@/lib/api";

type FeedbackItem = {
  id: string;
  category: string;
  content: string;
  rating: number;
  createdAt: string;
  username: string;
  userId: string;
};

const CATEGORIES = [
  { value: "LIKED", label: "What I liked", icon: "✦" },
  { value: "IMPROVEMENT", label: "Needs improvement", icon: "↑" },
  { value: "BUG", label: "Bug report", icon: "•" },
  { value: "OTHER", label: "Other", icon: "—" },
];

const categoryStyle: Record<string, string> = {
  LIKED: "border-emerald-800/40 text-emerald-500",
  IMPROVEMENT: "border-amber-800/40 text-amber-500",
  BUG: "border-red-800/40 text-red-400",
  OTHER: "border-neutral-800/40 text-neutral-500",
};

const categoryBg: Record<string, string> = {
  LIKED: "bg-emerald-500/5",
  IMPROVEMENT: "bg-amber-500/5",
  BUG: "bg-red-500/5",
  OTHER: "bg-neutral-500/5",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("LIKED");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    Promise.all([
      fetchFeedback().catch(() => []),
      fetchAuthStatus().catch(() => null),
    ]).then(([feedback, auth]) => {
      setFeedbackList(feedback);
      if (auth) setCurrentUserId(auth.id);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Please write something");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitFeedback({ category, content: content.trim(), rating });
      setContent("");
      setRating(0);
      setCategory("LIKED");
      setSuccess(true);
      setShowForm(false);
      setTimeout(() => setSuccess(false), 3000);
      const updated = await fetchFeedback();
      setFeedbackList(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit. Are you logged in?";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFeedback(id);
      setFeedbackList(feedbackList.filter(f => f.id !== id));
      toast.success("Feedback deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const statsMap = {
    LIKED: feedbackList.filter((f) => f.category === "LIKED").length,
    IMPROVEMENT: feedbackList.filter((f) => f.category === "IMPROVEMENT")
      .length,
    BUG: feedbackList.filter((f) => f.category === "BUG").length,
  };

  return (
    <div className="mx-auto max-w-screen-xl px-8 py-14">
      <div className="mb-10">
        <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700 block mb-3">
          Community
        </span>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-sans text-[32px] font-bold tracking-[-0.035em] text-white leading-none mb-2">
              Feedback
            </h1>
            <p className="font-mono-custom text-[11px] text-neutral-700">
              Help us improve — tell us what you loved and what needs work
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="font-mono-custom text-[10px] tracking-[0.14em] uppercase px-4 py-2 border border-neutral-700 rounded-md text-neutral-300 hover:text-white hover:border-neutral-500 transition-all duration-200"
          >
            {showForm ? "Cancel" : "Write feedback"}
          </button>
        </div>
      </div>

      {success && (
        <div className="mb-6 px-4 py-3 border border-emerald-800/40 bg-emerald-500/5 rounded-lg">
          <span className="font-mono-custom text-[11px] text-emerald-500">
            ✓ Thank you for your feedback!
          </span>
        </div>
      )}

      {showForm && (
        <div className="mb-10 border border-neutral-800/60 rounded-lg p-6 bg-[#0d0d0d]">
          <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700 block mb-5">
            New Feedback
          </span>
          <div className="flex gap-2 mb-5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`font-mono-custom text-[10px] tracking-[0.1em] px-3 py-1.5 border rounded-md transition-all duration-200 ${
                  category === cat.value
                    ? `${categoryStyle[cat.value]} ${categoryBg[cat.value]} border-current`
                    : "border-neutral-800/60 text-neutral-600 hover:text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <span className="mr-1.5">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            className="w-full bg-transparent border border-neutral-800/60 rounded-lg px-4 py-3 font-sans text-[13px] text-neutral-300 placeholder:text-neutral-800 focus:outline-none focus:border-neutral-700 transition-colors duration-200 resize-none mb-5"
          />
          <div className="flex items-center gap-4 mb-5">
            <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">
              Rating
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className={`text-[18px] transition-all duration-150 ${
                    star <= (hoveredStar || rating)
                      ? "text-amber-400 scale-110"
                      : "text-neutral-800 hover:text-neutral-600"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            {rating > 0 && (
              <span className="font-mono-custom text-[10px] text-neutral-600">
                {rating}/5
              </span>
            )}
          </div>
          {error && (
            <p className="font-mono-custom text-[11px] text-red-400 mb-4">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="font-mono-custom text-[10px] tracking-[0.14em] uppercase px-5 py-2.5 bg-white text-[#0a0a0a] rounded-md hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}
      {!loading && feedbackList.length > 0 && (
        <div className="grid grid-cols-3 gap-px mb-8 border border-neutral-800/60 rounded-lg overflow-hidden bg-neutral-800/40">
          {[
            {
              label: "Liked",
              count: statsMap.LIKED,
              color: "text-emerald-500",
            },
            {
              label: "Improvements",
              count: statsMap.IMPROVEMENT,
              color: "text-amber-500",
            },
            { label: "Bugs", count: statsMap.BUG, color: "text-red-400" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#0d0d0d] px-5 py-4 flex flex-col items-center"
            >
              <span
                className={`font-mono-custom text-[20px] font-medium tabular-nums ${s.color}`}
              >
                {s.count}
              </span>
              <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700 mt-1">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="border border-neutral-800/60 rounded-lg overflow-hidden">
        <div className="px-5 py-3 bg-[#0d0d0d] border-b border-neutral-800/60">
          <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">
            All Feedback · {feedbackList.length}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="font-mono-custom text-[11px] text-neutral-700 animate-pulse">
              Loading...
            </span>
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-800">
              No feedback yet
            </span>
            <p className="font-mono-custom text-[11px] text-neutral-700">
              Be the first to share your thoughts.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/40">
            {feedbackList.map((item) => (
              <div
                key={item.id}
                className="px-5 py-4 hover:bg-neutral-800/10 transition-colors duration-150 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`font-mono-custom text-[9px] tracking-[0.14em] uppercase px-2 py-0.5 border rounded ${categoryStyle[item.category]} ${categoryBg[item.category]}`}
                      >
                        {CATEGORIES.find((c) => c.value === item.category)
                          ?.icon || "—"}{" "}
                        {item.category.toLowerCase()}
                      </span>
                      <span className="font-sans text-[12px] font-medium text-neutral-500">
                        {item.username}
                      </span>
                      <span className="font-mono-custom text-[10px] text-neutral-800">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="font-sans text-[13px] text-neutral-400 leading-relaxed group-hover:text-neutral-300 transition-colors duration-150">
                      {item.content}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
                    {item.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span
                            key={s}
                            className={`text-[11px] ${s <= item.rating ? "text-amber-400" : "text-neutral-800"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                    {currentUserId === item.userId && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-[10px] font-mono-custom tracking-[0.15em] uppercase text-red-500/70 hover:text-red-400 transition-colors duration-200 mt-2"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
