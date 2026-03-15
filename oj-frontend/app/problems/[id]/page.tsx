import CodeSubmission from "@/components/CodeSubmission";
import ProblemTabs from "@/components/ProblemTabs";
import { fetchQuestionById } from "@/lib/api";
import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProblemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const question = await fetchQuestionById(id);

  const difficultyColor: Record<string, string> = {
    easy:   "text-emerald-500",
    medium: "text-amber-500",
    hard:   "text-red-500",
  };
  const diffKey = question.difficulty.toLowerCase();
  return (
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
      <div className="flex-1 min-w-0 overflow-y-auto border-r border-neutral-800/60">
        <div className="max-w-2xl px-8 py-10 lg:px-10">
          <Link
            href="/problems"
            className="inline-flex items-center gap-1.5 font-mono-custom text-[10px] tracking-[0.18em] uppercase text-neutral-700 hover:text-neutral-400 transition-colors duration-200 mb-10"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path
                d="M10 7H4M4 7L6.5 4.5M4 7L6.5 9.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Problems
          </Link>
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`font-mono-custom text-[10px] tracking-[0.18em] uppercase font-medium ${difficultyColor[diffKey] || "text-neutral-600"}`}
              >
                {question.difficulty}
              </span>
              <span className="w-1 h-1 rounded-full bg-neutral-800" />
              <span className="font-mono-custom text-[10px] tracking-[0.18em] uppercase text-neutral-700">
                {question.id}
              </span>
            </div>
            <h1 className="font-sans text-[26px] font-bold tracking-[-0.035em] text-white leading-tight">
              {question.title}
            </h1>
          </div>
          <ProblemTabs question={question} />
        </div>
      </div>
      <div className="hidden lg:flex w-[50%] xl:w-[55%] flex-col bg-[#0d0d0d]">
        <div className="flex-1 min-h-0 p-3">
          <CodeSubmission questionId={question.id} />
        </div>
      </div>
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-neutral-800/60 bg-[#0a0a0a]/90 backdrop-blur-sm p-3">
        <Link
          href={`/problems/${question.id}#editor`}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white font-mono-custom text-[11px] tracking-[0.14em] uppercase font-medium text-neutral-900 hover:bg-neutral-200 transition-colors duration-200"
        >
          Open Editor
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>

    </div>
  );
}