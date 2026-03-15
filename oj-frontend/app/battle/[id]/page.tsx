"use client";
import { useEffect, useState, use } from "react";
import { useBattleSocket } from "@/hooks/useBattleSocket";
import { fetchAuthStatus, getBattle } from "@/lib/api";
import ReconnectTimer from "@/components/ReconnectComp";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

type BattleData = {
  player1Id: string; player2Id: string; questionId: string; status: string;
  winnerId: string | null; player1Time: number | null; player2Time: number | null;
  player1Hints: number; player2Hints: number; startedAt: string | null; endedAt: string | null;
  question: { id: string; title: string; statement: string; examples: unknown; constraints: string; difficulty?: string };
};
type PageProps = { params: Promise<{ id: string }> };

export default function BattleArena({ params }: PageProps) {
  const { id: battleId } = use(params);
  const [userId, setUserId]       = useState<string | null>(null);
  const [battleData, setBattleData] = useState<BattleData | null>(null);
  const battle = useBattleSocket(battleId, userId || "");
  const [language, setLanguage]   = useState("javascript");
  const boilerplate: Record<string, string> = {
    javascript: `// Read input using readline()\n// All of stdin is also available as: input (string) and lines (array)\n\nconst line = readline();\nconsole.log(line);\n`,
    python:     `# Read input using input()\n# Use sys.stdin for bulk reads\n\nline = input()\nprint(line)\n`,
    cpp:        `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    string line;\n    getline(cin, line);\n    cout << line << endl;\n    return 0;\n}\n`,
  };
  const [code, setCode]           = useState(boilerplate["javascript"]);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    fetchAuthStatus().then((res) => { if (res?.id) setUserId(res.id); });
    getBattle(battleId).then(setBattleData).catch(() => toast.error("Battle not found"));
  }, [battleId]);

  useEffect(() => {
    if (battleData?.status === "COMPLETED" || battle.status !== "active") return;
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [battle.status, battleData?.status]);

  if (!userId || !battleData) {
    return (
      <div className="flex h-[calc(100vh-3rem)] items-center justify-center bg-[#0a0a0a]">
        <svg className="h-5 w-5 animate-spin text-neutral-700" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  const { question } = battleData;
  const isAlreadyCompleted = battleData.status === "COMPLETED" || battleData.status === "ABANDONED";
  const amIWinner = isAlreadyCompleted && battleData.winnerId === userId;
  const isDraw    = isAlreadyCompleted && battleData.winnerId === null;

  const handleSubmit = () => {
    if (!code.trim()) { toast.error("Code cannot be empty"); return; }
    battle.sendSubmit(code, language);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (code === boilerplate[language] || code.trim() === "") setCode(boilerplate[newLang]);
  };

  let timeDisplay = "--:--";
  if (battle.status === "active" && battle.startTime > 0) {
    const timeLeft = Math.max(0, battle.duration - (currentTime - battle.startTime));
    const m = Math.floor(timeLeft / 60000);
    const s = Math.floor((timeLeft % 60000) / 1000);
    timeDisplay = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  const difficultyColor = (d?: string) => {
    switch (d?.toUpperCase()) {
      case "EASY":   return "text-emerald-500";
      case "MEDIUM": return "text-amber-500";
      case "HARD":   return "text-red-500";
      default:       return "text-neutral-600";
    }
  };

  const resultColor = (won: boolean, draw: boolean) =>
    won ? "text-emerald-500" : draw ? "text-amber-500" : "text-red-500";
  const resultLabel = (won: boolean, draw: boolean) =>
    won ? "Victory" : draw ? "Draw" : "Defeat";

  const latestOpponentEvent = battle.opponentEvents.length > 0
    ? battle.opponentEvents[battle.opponentEvents.length - 1] : null;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] bg-[#0a0a0a] overflow-hidden relative">
      <div className="flex items-center justify-between px-6 h-11 border-b border-neutral-800/60 bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-sans text-[13px] font-semibold text-neutral-300 tracking-[-0.01em]">Battle</span>
          <span className="font-mono-custom text-[10px] text-neutral-800">{battleId.substring(0, 8)}</span>
        </div>

        <div className="flex items-center">
          {battle.status === "waiting" && (
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 animate-pulse" />
              <span className="font-mono-custom text-[10px] tracking-[0.15em] uppercase text-neutral-600">
                Waiting for opponent
              </span>
            </div>
          )}
          {battle.status === "countdown" && (
            <span className="font-sans text-[22px] font-bold text-white tabular-nums tracking-[-0.04em] animate-pulse">
              {battle.countdown}
            </span>
          )}
          {battle.status === "active" && !isAlreadyCompleted && (
            <span className="font-mono-custom text-[15px] font-medium text-neutral-300 tabular-nums tracking-[0.06em]">
              {timeDisplay}
            </span>
          )}
          {battle.status === "finished" && !isAlreadyCompleted && (
            <span className={`font-sans text-[13px] font-bold tracking-[-0.01em] ${resultColor(battle.won ?? false, battle.eloChange === 0)}`}>
              {resultLabel(battle.won ?? false, battle.eloChange === 0)}
            </span>
          )}
          {isAlreadyCompleted && (
            <span className={`font-sans text-[13px] font-bold tracking-[-0.01em] ${resultColor(amIWinner, isDraw)}`}>
              {resultLabel(amIWinner, isDraw)}
            </span>
          )}
        </div>
        {battle.status === "active" && (
          <button
            onClick={() => battle.sendLeave()}
            className="font-mono-custom text-[10px] tracking-[0.15em] uppercase text-neutral-700 hover:text-neutral-400 transition-colors duration-200"
          >
            Forfeit
          </button>
        )}
      </div>
      {battle.opponentDisconnected && battle.status === "active" && (
        <div className="w-full border-b border-neutral-800/60 bg-[#0d0d0d] px-6 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-pulse" />
            <span className="font-mono-custom text-[10px] tracking-[0.15em] uppercase text-neutral-600">
              Opponent disconnected
            </span>
          </div>
          <ReconnectTimer />
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 flex flex-col border-r border-neutral-800/60">
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <div className="max-w-xl">
              <div className="flex items-start justify-between gap-4 mb-8">
                <h1 className="font-sans text-[20px] font-bold tracking-[-0.03em] text-white leading-snug">
                  {question.title}
                </h1>
                {question.difficulty && (
                  <span className={`font-mono-custom text-[9px] tracking-[0.18em] uppercase shrink-0 mt-1 ${difficultyColor(question.difficulty)}`}>
                    {question.difficulty}
                  </span>
                )}
              </div>
              <div className="prose prose-invert prose-sm max-w-none
                prose-p:text-neutral-500 prose-p:leading-relaxed prose-p:font-light
                prose-pre:bg-[#0d0d0d] prose-pre:border prose-pre:border-neutral-800/60 prose-pre:rounded-md
                prose-code:text-emerald-500 prose-code:text-[12px]
                prose-headings:text-neutral-300 prose-headings:font-semibold
                prose-strong:text-neutral-300
                prose-li:text-neutral-500">
                <ReactMarkdown>{question.statement}</ReactMarkdown>
              </div>
              {question.constraints && (
                <div className="mt-10 pt-8 border-t border-neutral-800/50">
                  <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700 block mb-4">
                    Constraints
                  </span>
                  <div className="prose prose-sm prose-invert max-w-none prose-p:text-neutral-600 prose-li:text-neutral-600 prose-ul:mt-0">
                    <ReactMarkdown>{question.constraints}</ReactMarkdown>
                  </div>
                </div>
              )}
              {battle.status === "active" && (
                <div className="mt-10 pt-8 border-t border-neutral-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">
                      Hints
                    </span>
                    <span className="font-mono-custom text-[10px] text-neutral-800 tabular-nums">
                      {3 - battle.hintsUsed} remaining
                    </span>
                  </div>
                  {battle.hint && (
                    <div className="p-4 mb-4 rounded-md border border-neutral-800/60 bg-[#0d0d0d]">
                      <p className="font-mono-custom text-[11px] text-neutral-500 leading-relaxed">{battle.hint}</p>
                    </div>
                  )}
                  {battle.hintsUsed < 3 && (
                    <button
                      onClick={() => battle.sendHint()}
                      className="w-full h-9 rounded-md border border-neutral-800/60 font-mono-custom text-[10px] tracking-[0.15em] uppercase text-neutral-700 hover:border-neutral-700 hover:text-neutral-400 transition-colors duration-200"
                    >
                      Request Hint
                      <span className="text-neutral-800 ml-1.5">
                        (−{battle.hintsUsed === 0 ? "2" : battle.hintsUsed === 1 ? "3" : "5"} min)
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-1/2 flex flex-col">
          <div className="flex items-center justify-between px-4 h-10 border-b border-neutral-800/60 shrink-0 bg-[#0d0d0d]">
            <select
              value={language}
              onChange={handleLanguageChange}
              style={{ colorScheme: "dark" }}
              className="bg-transparent font-mono-custom text-[10px] tracking-[0.12em] uppercase text-neutral-600 hover:text-neutral-300 outline-none cursor-pointer transition-colors duration-200"
            >
              <option value="javascript" className="bg-neutral-900">JavaScript</option>
              <option value="python"     className="bg-neutral-900">Python</option>
              <option value="cpp"        className="bg-neutral-900">C++</option>
            </select>
            {latestOpponentEvent && (
              <span className="font-mono-custom text-[10px] text-neutral-700 animate-fade-in-up">
                {latestOpponentEvent}
              </span>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "Geist Mono, JetBrains Mono, monospace",
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                formatOnPaste: true,
                padding: { top: 16 },
                renderLineHighlight: "none",
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
              }}
            />
          </div>
          <div className="p-3 border-t border-neutral-800/60 shrink-0 bg-[#0d0d0d]">
            {battle.verdict && (
              <div className={`px-4 py-3 rounded-md border mb-3 ${
                battle.verdict === "AC"
                  ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-500"
                  : "bg-red-500/5 border-red-500/15 text-red-500"
              }`}>
                <span className="font-mono-custom text-[10px] tracking-[0.18em] uppercase font-medium">
                  {battle.verdict}
                </span>
                {battle.verdictMessage && (
                  <p className="font-mono-custom text-[10px] mt-1.5 opacity-60 whitespace-pre-wrap leading-relaxed">
                    {battle.verdictMessage}
                  </p>
                )}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={battle.isSubmitting || battle.status !== "active"}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-md bg-white font-mono-custom text-[11px] tracking-[0.14em] uppercase font-medium text-neutral-900 hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {battle.isSubmitting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Judging
                </>
              ) : "Submit"}
            </button>
          </div>
        </div>
      </div>
      {battle.status === "finished" && (
        <ResultOverlay
          won={battle.won ?? false}
          draw={battle.eloChange === 0}
          message={battle.verdictMessage || (battle.won ? "You solved it first." : battle.eloChange === 0 ? "Neither player solved it in time." : "Your opponent solved it first.")}
          newRating={battle.newRating ?? 0}
          eloChange={battle.eloChange ?? 0}
        />
      )}

      {isAlreadyCompleted && (
        <ResultOverlay
          won={amIWinner}
          draw={isDraw}
          message="This battle has already ended."
          newRating={0}
          eloChange={0}
        />
      )}
    </div>
  );
}

function ResultOverlay({ won, draw, message, newRating, eloChange }: {
  won: boolean; draw: boolean; message: string; newRating: number; eloChange: number;
}) {
  const color = won ? "text-emerald-500" : draw ? "text-amber-500" : "text-red-500";
  const label = won ? "Victory" : draw ? "Draw" : "Defeat";

  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-xs border border-neutral-800/60 rounded-lg bg-[#0d0d0d] p-8 text-center">

        <span className={`font-sans text-[36px] font-bold tracking-[-0.04em] leading-none block mb-3 ${color}`}>
          {label}
        </span>
        <p className="font-mono-custom text-[11px] text-neutral-700 mb-8 leading-relaxed">
          {message}
        </p>

        {newRating > 0 ? (
          <div className="mb-8 border border-neutral-800/60 rounded-md bg-[#111111] px-6 py-5">
            <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700 block mb-2.5">
              New Rating
            </span>
            <span className="font-sans text-[36px] font-bold tracking-[-0.04em] text-white leading-none tabular-nums block">
              {newRating}
            </span>
            <span className={`font-mono-custom text-[12px] font-medium mt-2 tabular-nums block ${eloChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {eloChange > 0 ? "+" : ""}{eloChange}
            </span>
          </div>
        ) : (
          <div className="mb-8 border border-neutral-800/60 rounded-md bg-[#111111] px-6 py-4">
            <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700 block mb-1.5">
              Rating
            </span>
            <span className="font-mono-custom text-[12px] text-neutral-700">No change</span>
          </div>
        )}

        <button
          onClick={() => (window.location.href = "/battle")}
          className="w-full h-10 rounded-md bg-white font-mono-custom text-[11px] tracking-[0.14em] uppercase font-medium text-neutral-900 hover:bg-neutral-200 transition-colors duration-200 active:scale-[0.99]"
        >
          Back to Lobby
        </button>
      </div>
    </div>
  );
}