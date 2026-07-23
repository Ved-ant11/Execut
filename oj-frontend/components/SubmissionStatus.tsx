"use client";
import { useEffect, useState } from "react";
import { fetchSubmissionStatus, fetchReview } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  submissionId: string;
};

interface DiffData {
  message?: string;
  input?: string;
  expected?: string;
  actual?: string;
  [key: string]: unknown;
}

export default function SubmissionStatus({ submissionId }: Props) {
  const [status, setStatus] = useState<string>("LOADING");
  const [result, setResult] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [, setLanguage] = useState<string | null>(null);
  const [error] = useState<string | null>(null);
  const [review, setReview] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchSubmissionStatus(submissionId).then((data) => {
    setStatus(data.status);
    setResult(data.result ?? null);
    setCode(data.code ?? null);
    setLanguage(data.language ?? null);
  }).catch(() => {});

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(JSON.stringify({ type: "subscribe", submissionId }));
    };

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        console.error("Failed to parse websocket message:", event.data);
        return;
      }
      setStatus(data.status);
      setResult(data.result ?? null);
      setCode(data.code ?? null);
      setLanguage(data.language ?? null);

      if (data.status === "COMPLETED" || data.status === "FAILED") {
        ws.close();
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.onerror = () => {
      // Fall back to polling
      const interval = setInterval(async () => {
      const data = await fetchSubmissionStatus(submissionId);
      setStatus(data.status);
      setResult(data.result ?? null);
      setCode(data.code ?? null);
      setLanguage(data.language ?? null);
      if (data.status === "COMPLETED" || data.status === "FAILED") {
        clearInterval(interval);
    }
  }, 1500);
};

    return () => ws.close();
  }, [submissionId]);

  if (error) {
    return (
      <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-6">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (status === "LOADING" || status === "QUEUED" || status === "RUNNING") {
    return (
      <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-6">
        <div className="flex items-center gap-3">
          <svg
            className="h-4 w-4 animate-spin text-neutral-400"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeOpacity="0.15"
            />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm text-neutral-400">
            {status === "LOADING" && "Loading..."}
            {status === "QUEUED" && "In queue..."}
            {status === "RUNNING" && "Running..."}
          </span>
        </div>
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-6">
        <p className="text-sm font-medium text-red-400">Submission Failed</p>
        <p className="mt-1 text-xs text-neutral-500">
          Something went wrong. Please try again.
        </p>
      </div>
    );
  }

  if (status === "COMPLETED" && result) {
    const r = result.toLowerCase();
    let diffData: DiffData | null = null;
    if (result && (result.startsWith("{") || result.startsWith("["))) {
      try {
        diffData = JSON.parse(result);
      } catch (e) {
        console.error("Failed to parse result", e);
      }
    }
    let verdictColor = "text-neutral-400";
    let verdictLabel = result;

    if (r.includes("accepted")) {
      verdictColor = "text-emerald-500";
      verdictLabel = "Accepted";
    } else if (r.includes("wrong")) {
      verdictColor = "text-red-400";
      verdictLabel = "Wrong Answer";
    } else if (r.includes("time") && !r.includes("run")) {
      verdictColor = "text-amber-500";
      verdictLabel = "Time Limit Exceeded";
    } else if (r.includes("runtime")) {
      verdictColor = "text-orange-400";
      verdictLabel = "Runtime Error";
    } else if (r.includes("compilation")) {
      verdictColor = "text-purple-400";
      verdictLabel = "Compilation Error";
    }

    return (
      <>
        <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-6">
          <p className={`text-lg font-semibold ${verdictColor}`}>
            {diffData ? diffData.message ?? verdictLabel : verdictLabel}
          </p>
          {!diffData && result !== verdictLabel && (
            <p className="mt-2 text-sm text-neutral-400 font-mono bg-neutral-950 p-3 rounded border border-neutral-800/50 whitespace-pre-wrap">
              {result}
            </p>
          )}
          {diffData && (
            <div className="mt-4 flex flex-col gap-3 font-mono text-sm">
              {diffData.input && (
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Input:</div>
                  <div className="bg-neutral-950 p-3 rounded border border-neutral-800 text-neutral-300 w-full overflow-x-auto whitespace-pre-wrap">
                    {diffData.input}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <div className="text-xs text-emerald-500/80 mb-1">Expected Output:</div>
                  <div className="bg-emerald-950/20 p-3 rounded border border-emerald-900/30 text-emerald-200 w-full overflow-x-auto whitespace-pre-wrap h-full">
                    {diffData.expected}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-red-500/80 mb-1">Your Output:</div>
                  <div className="bg-red-950/20 p-3 rounded border border-red-900/30 text-red-200 w-full overflow-x-auto whitespace-pre-wrap h-full">
                    {diffData.actual || <span className="text-red-500/50 italic">No output</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {code && (
          <div className="mt-4">
            <p className="text-xs font-medium text-neutral-500 mb-2">Your Code</p>
            <pre className="rounded-md border border-neutral-800 bg-neutral-900 p-4 font-mono text-xs text-neutral-300 overflow-x-auto max-h-80 overflow-y-auto">
              {code}
            </pre>
            <button
              onClick={async () => {
                setReviewLoading(true);
                try {
                  const data = await fetchReview(submissionId);
                  setReview(data.review);
                } catch {
                  setReview("Failed to fetch AI review.");
                } finally {
                  setReviewLoading(false);
                }
              }}
              disabled={reviewLoading}
              className="mt-4 px-4 py-2 text-sm rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              {reviewLoading ? "Analyzing..." : "✨ Get AI Review"}
            </button>
            {review && (
              <div className="mt-4 rounded-md border border-neutral-800 bg-neutral-900/50 p-6 prose prose-sm prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{review}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-6">
      <p className="text-sm text-neutral-500">Loading...</p>
    </div>
  );
}
