"use client";
import { useEffect, useState } from "react";
import { fetchQuestions, fetchSolvedIds } from "@/lib/api";
import Link from "next/link";

export default function ProblemsPage() {
  const [questions, setQuestions] = useState<
    { id: string; title: string; difficulty: string }[]
  >([]);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      try {
        const [questionsData, solved] = await Promise.all([
          fetchQuestions(),
          fetchSolvedIds(),
        ]);
        setQuestions(questionsData);
        setSolvedIds(new Set(solved));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const difficultyColor: Record<string, string> = {
    easy:   "text-emerald-500",
    medium: "text-amber-500",
    hard:   "text-red-500",
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficulty === "all" || q.difficulty.toLowerCase() === difficulty;
    return matchesSearch && matchesDifficulty;
  });

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

  return (
    <div className="mx-auto max-w-screen-xl px-8 py-14">

      <div className="mb-10">
        <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700 block mb-3">
          Practice
        </span>
        <h1 className="font-sans text-[32px] font-bold tracking-[-0.035em] text-white leading-none">
          Problems
        </h1>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-700"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#0d0d0d] border border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 text-neutral-300 placeholder:text-neutral-700 rounded-md pl-9 pr-4 py-2 font-mono-custom text-[11px] tracking-wide outline-none transition-colors duration-200 w-64"
          />
        </div>

        <div className="relative flex items-center">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ colorScheme: "dark" }}
            className="appearance-none bg-[#0d0d0d] border border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 text-neutral-500 rounded-md pl-3 pr-8 py-2 font-mono-custom text-[11px] tracking-[0.1em] uppercase outline-none cursor-pointer transition-colors duration-200"
          >
            <option value="all">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <span className="pointer-events-none absolute right-3 text-neutral-700 text-[9px]">▾</span>
        </div>
      </div>

      <div className="border border-neutral-800/60 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_80px] gap-4 px-5 py-3 bg-[#0d0d0d] border-b border-neutral-800/60">
          <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">Title</span>
          <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">Difficulty</span>
          <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700 text-right">Status</span>
        </div>

        <div className="divide-y divide-neutral-800/40">
          {filteredQuestions.map((question, index) => {
            const diff = question.difficulty.toLowerCase();
            const isSolved = solvedIds.has(question.id);
            return (
              <Link
                key={question.id}
                href={`/problems/${question.id}`}
                className="grid grid-cols-[1fr_120px_80px] gap-4 px-5 py-3.5 items-center hover:bg-neutral-800/20 transition-colors duration-150 group"
              >
                <span className="font-sans text-[13px] font-medium text-neutral-400 group-hover:text-neutral-200 transition-colors duration-150 truncate tracking-[-0.01em]">
                  <span className="font-mono-custom text-[11px] text-neutral-700 mr-3">{index + 1}.</span>
                  {question.title}
                </span>
                <span className={`font-mono-custom text-[10px] tracking-[0.15em] uppercase font-medium ${difficultyColor[diff] || "text-neutral-600"}`}>
                  {question.difficulty}
                </span>
                <div className="flex justify-end">
                  {isSolved ? (
                    <div className="text-emerald-500 bg-emerald-500/10 p-1 rounded-full">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  ) : (
                    <span className="font-mono-custom text-[11px] text-neutral-800">—</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {filteredQuestions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-800">
            No results
          </span>
          <p className="font-mono-custom text-[11px] text-neutral-700">
            No problems match your search.
          </p>
        </div>
      )}

    </div>
  );
}