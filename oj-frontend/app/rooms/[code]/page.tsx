"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthStatus, fetchRoom, fetchQuestionById, joinRoom } from "@/lib/api";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

type PageProps = {
  params: Promise<{ code: string }>;
};

export default function RoomArena({ params }: PageProps) {
  const router = useRouter();
  const { code: roomCode } = use(params);
  const [roomId, setRoomId]   = useState<string | null>(null);
  const [userId, setUserId]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("cpp");

  const boilerplate: Record<string, string> = {
    javascript: "function solve() {\n  // your code here\n}\n",
    python:     "def solve():\n    # your code here\n    pass\n",
    cpp:        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  // your code here\n  return 0;\n}\n",
  };

  const [code, setCode] = useState(boilerplate["cpp"]);
  const [question, setQuestion] = useState<{
    title: string;
    statement: string;
    difficulty: string;
    examples: { input: string; output: string; explanation?: string }[];
  } | null>(null);

  const {
    status, players, ownerId, questionId, events,
    leaderboard, sendReady, sendStart, sendSubmit, sendEnd,
  } = useRoomSocket(roomId || "", userId || "");

  useEffect(() => {
    const init = async () => {
      try {
        const auth = await fetchAuthStatus();
        if (!auth) { router.push("/login"); return; }
        setUserId(auth.id);

        let joinData;
        try {
          joinData = await joinRoom(roomCode);
        } catch (err) {
          router.push("/rooms"); 
          toast.error("Failed to join room"); 
          return;
        }

        setRoomId(joinData.roomId);

        const roomData = await fetchRoom(joinData.roomId);
        if (roomData.questionId) {
          const q = await fetchQuestionById(roomData.questionId);
          setQuestion(q);
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading room");
        router.push("/rooms");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [roomCode, router]);

  useEffect(() => {
    if (questionId && !question) {
      fetchQuestionById(questionId).then(setQuestion).catch(console.error);
    }
  }, [questionId, question]);

  if (loading || status === "connecting") {
    return (
      <div className="flex h-[calc(100vh-3rem)] items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-5 w-5 animate-spin text-neutral-700" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700">
            Connecting
          </span>
        </div>
      </div>
    );
  }

  const isOwner  = ownerId === userId;
  const me       = players.find((p) => p.userId === userId);
  const amIReady = me?.isReady || false;
  const allReady = players.length > 0 && players.every((p) => p.isReady);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  const difficultyColor = (d: string) => {
    switch (d?.toUpperCase()) {
      case "EASY":   return "text-emerald-500";
      case "MEDIUM": return "text-amber-500";
      case "HARD":   return "text-red-500";
      default:       return "text-neutral-600";
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] bg-[#0a0a0a] text-neutral-300 overflow-hidden">

      {/* ── LEFT PANEL ── */}
      <div className="flex w-1/2 flex-col border-r border-neutral-800/60 bg-[#0a0a0a] overflow-y-auto">

        {/* ── WAITING LOBBY ── */}
        {status === "WAITING" ? (
          <div className="p-10 h-full flex flex-col justify-center max-w-[400px] mx-auto w-full">

            <div className="mb-3">
              <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700 block mb-3">
                Arena
              </span>
              <h1 className="font-sans text-[28px] font-bold tracking-[-0.035em] text-white leading-none mb-1">
                Room Lobby
              </h1>
              <p className="font-mono-custom text-[11px] text-neutral-700">
                Share the code. Ready up. Fight.
              </p>
            </div>

            <div className="mt-10 mb-6 border border-neutral-800/60 rounded-lg bg-[#0d0d0d] p-5">
              <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700 block mb-3">
                Room Code
              </span>
              <div className="flex items-center justify-between">
                <span className="font-sans text-[32px] font-bold tracking-[0.08em] text-white tabular-nums">
                  {roomCode}
                </span>
                <button
                  onClick={() => { navigator.clipboard.writeText(roomCode); toast.success("Copied"); }}
                  className="font-mono-custom text-[9px] tracking-[0.18em] uppercase text-neutral-700 hover:text-neutral-400 border-b border-neutral-800 hover:border-neutral-600 pb-px transition-colors duration-200"
                >
                  Copy →
                </button>
              </div>
            </div>

            <div className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] overflow-hidden mb-4">
              <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800/60">
                <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">
                  Players
                </span>
                <span className="font-mono-custom text-[9px] text-neutral-800 tabular-nums">
                  {players.length} joined
                </span>
              </div>
              <div className="divide-y divide-neutral-800/40">
                {players.map((p) => (
                  <div key={p.userId} className="px-5 py-3.5 flex items-center justify-between hover:bg-neutral-800/20 transition-colors duration-150">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-neutral-800 flex items-center justify-center font-sans text-[11px] font-bold text-neutral-400">
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-[13px] font-medium text-neutral-300 tracking-[-0.01em]">
                            {p.username}
                          </span>
                          {p.userId === ownerId && (
                            <span className="font-mono-custom text-[8px] tracking-[0.15em] uppercase text-amber-500 border border-amber-500/30 rounded-sm px-1.5 py-0.5">
                              Host
                            </span>
                          )}
                        </div>
                        {p.userId === userId && (
                          <span className="font-mono-custom text-[9px] text-neutral-700">you</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.isConnected ? "bg-emerald-500" : "bg-neutral-700"}`} />
                      <span className={`font-mono-custom text-[9px] tracking-[0.15em] uppercase ${p.isReady ? "text-emerald-500" : "text-neutral-700"}`}>
                        {p.isReady ? "Ready" : "Waiting"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => sendReady(!amIReady)}
                className={`w-full h-10 rounded-md font-mono-custom text-[10px] tracking-[0.14em] uppercase font-medium transition-colors duration-200 ${
                  amIReady
                    ? "bg-[#0d0d0d] border border-neutral-800/60 text-neutral-600 hover:border-neutral-700 hover:text-neutral-400"
                    : "bg-white text-neutral-900 hover:bg-neutral-200"
                }`}
              >
                {amIReady ? "Cancel Ready" : "Ready Up"}
              </button>

              {isOwner && (
                <button
                  onClick={sendStart}
                  disabled={!allReady}
                  className="w-full h-10 rounded-md bg-emerald-500 font-mono-custom text-[10px] tracking-[0.14em] uppercase font-medium text-white hover:bg-emerald-400 transition-colors duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  Start Match
                </button>
              )}
            </div>
          </div>

        /* ── COMPLETED / RESULTS ── */
        ) : status === "COMPLETED" ? (
          <div className="p-10 h-full flex flex-col items-center justify-center max-w-[400px] mx-auto w-full">

            <div className="mb-10 text-center">
              <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700 block mb-3">
                Results
              </span>
              <h2 className="font-sans text-[32px] font-bold tracking-[-0.04em] text-white leading-none">
                Match Over
              </h2>
            </div>

            <div className="w-full border border-neutral-800/60 rounded-lg bg-[#0d0d0d] overflow-hidden mb-4">
              <div className="grid grid-cols-[40px_1fr_80px] gap-4 px-5 py-3 bg-[#0d0d0d] border-b border-neutral-800/60">
                {["#", "Player", "Time"].map((h, i) => (
                  <span key={i} className={`font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700 ${i === 2 ? "text-right" : ""}`}>
                    {h}
                  </span>
                ))}
              </div>

              <div className="divide-y divide-neutral-800/40">
                {leaderboard.map((player, i) => (
                  <div key={i} className="grid grid-cols-[40px_1fr_80px] gap-4 px-5 py-3.5 items-center hover:bg-neutral-800/20 transition-colors duration-150">
                    <span className={`font-mono-custom text-[12px] font-medium tabular-nums ${
                      i === 0 ? "text-amber-400" : i === 1 ? "text-neutral-400" : i === 2 ? "text-amber-700" : "text-neutral-800"
                    }`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-sans text-[13px] font-medium text-neutral-300 tracking-[-0.01em]">
                      {player.username}
                    </span>
                    <span className="font-mono-custom text-[11px] text-emerald-500 text-right tabular-nums">
                      {formatTime(player.time)}
                    </span>
                  </div>
                ))}

                {players
                  .filter((p) => !leaderboard.find((l) => l.username === p.username))
                  .map((p, i) => (
                    <div key={`dnf-${i}`} className="grid grid-cols-[40px_1fr_80px] gap-4 px-5 py-3.5 items-center opacity-30">
                      <span className="font-mono-custom text-[12px] text-neutral-700">—</span>
                      <span className="font-sans text-[13px] font-medium text-neutral-500 tracking-[-0.01em]">{p.username}</span>
                      <span className="font-mono-custom text-[11px] text-red-500 text-right">DNF</span>
                    </div>
                  ))}
              </div>
            </div>

            <button
              onClick={() => router.push("/rooms")}
              className="w-full h-10 rounded-md bg-white font-mono-custom text-[10px] tracking-[0.14em] uppercase font-medium text-neutral-900 hover:bg-neutral-200 transition-colors duration-200"
            >
              Back to Rooms
            </button>
          </div>

        /* ── ACTIVE: QUESTION PANEL ── */
        ) : (
          question && (
            <div className="px-8 py-8 h-full overflow-y-auto">
              <div className="flex items-start justify-between gap-4 mb-8">
                <h1 className="font-sans text-[20px] font-bold tracking-[-0.03em] text-white leading-snug">
                  {question.title}
                </h1>
                <span className={`font-mono-custom text-[9px] tracking-[0.18em] uppercase shrink-0 mt-1 ${difficultyColor(question.difficulty)}`}>
                  {question.difficulty}
                </span>
              </div>

              <div className="prose prose-invert prose-sm max-w-none
                prose-p:text-neutral-500 prose-p:leading-relaxed prose-p:font-light prose-p:text-[13px]
                prose-pre:bg-[#0d0d0d] prose-pre:border prose-pre:border-neutral-800/60 prose-pre:rounded-md
                prose-code:text-emerald-500 prose-code:text-[12px]
                prose-headings:text-neutral-300 prose-headings:font-semibold
                prose-strong:text-neutral-300 prose-li:text-neutral-500 mb-8">
                <ReactMarkdown>{question.statement}</ReactMarkdown>
              </div>

              {question.examples && (
                <div className="space-y-3">
                  <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700 block">
                    Examples
                  </span>
                  {(question.examples as { input: string; output: string; explanation?: string }[]).map((ex, i) => (
                    <div key={i} className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-neutral-800/60">
                        <span className="font-mono-custom text-[9px] tracking-[0.2em] uppercase text-neutral-700">
                          Example {i + 1}
                        </span>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex gap-3">
                          <span className="font-mono-custom text-[10px] tracking-[0.15em] uppercase text-neutral-700 w-14 shrink-0">Input</span>
                          <span className="font-mono-custom text-[11px] text-neutral-400">{ex.input}</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="font-mono-custom text-[10px] tracking-[0.15em] uppercase text-neutral-700 w-14 shrink-0">Output</span>
                          <span className="font-mono-custom text-[11px] text-emerald-500">{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <div className="pt-2 border-t border-neutral-800/40">
                            <span className="font-mono-custom text-[10px] text-neutral-700 leading-relaxed">{ex.explanation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* ── RIGHT PANEL: EDITOR ── */}
      <div className="flex w-1/2 flex-col bg-[#0d0d0d]">

        {/* Editor topbar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#0d0d0d] border-b border-neutral-800/60">
          <div className="flex items-center gap-1">
            {["cpp", "python", "javascript"].map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  if (status === "ACTIVE") { setLanguage(lang); setCode(boilerplate[lang] || ""); }
                }}
                disabled={status !== "ACTIVE"}
                className={`font-mono-custom text-[9px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-md transition-colors duration-150 disabled:cursor-not-allowed ${
                  language === lang
                    ? "bg-neutral-800/60 text-neutral-300 border border-neutral-700/60"
                    : "text-neutral-700 hover:text-neutral-400"
                }`}
              >
                {lang === "cpp" ? "C++" : lang === "python" ? "Python" : "JS"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isOwner && status === "ACTIVE" && (
              <button
                onClick={sendEnd}
                className="h-8 px-4 border border-neutral-800/60 rounded-md font-mono-custom text-[9px] tracking-[0.15em] uppercase text-neutral-700 hover:border-red-500/30 hover:text-red-500 transition-colors duration-200"
              >
                End Match
              </button>
            )}
            <button
              onClick={() => sendSubmit(code, language)}
              disabled={status !== "ACTIVE" || me?.hasFinished}
              className="h-8 px-5 bg-white rounded-md font-mono-custom text-[9px] tracking-[0.15em] uppercase font-medium text-neutral-900 hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {me?.hasFinished ? "Submitted ✓" : "Submit"}
            </button>
          </div>
        </div>

        {/* Monaco editor */}
        <div className="flex-1 relative min-h-0">
          <Editor
            height="100%"
            language={language === "cpp" ? "cpp" : language}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "JetBrains Mono, monospace",
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              lineHeight: 22,
              renderLineHighlight: "none",
              readOnly: status !== "ACTIVE" || me?.hasFinished,
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
            }}
          />

          {status === "WAITING" && (
            <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2">
              <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700">
                Waiting for match to start
              </span>
            </div>
          )}
        </div>

        {/* Events terminal */}
        <div className="h-40 border-t border-neutral-800/60 flex flex-col bg-[#0d0d0d]">
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-neutral-800/60">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 animate-pulse" />
              <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">
                Live Events
              </span>
            </div>
            <span className="font-mono-custom text-[9px] text-neutral-800 tabular-nums">
              {events.length} event{events.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex-1 px-5 py-3 overflow-y-auto space-y-1.5">
            {events.length === 0 ? (
              <span className="font-mono-custom text-[10px] text-neutral-800 select-none">
                Waiting for events...
              </span>
            ) : (
              [...events].reverse().map((ev, i) => (
                <div key={i} className="flex items-start gap-2 text-neutral-700 hover:text-neutral-400 transition-colors duration-100">
                  <span className="text-neutral-800 shrink-0 mt-px">›</span>
                  <span className="font-mono-custom text-[10px]">{ev}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}