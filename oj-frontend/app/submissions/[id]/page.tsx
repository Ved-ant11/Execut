import SubmissionStatus from "@/components/SubmissionStatus";
import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SubmissionPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-screen-xl px-8 py-14">
      <div className="max-w-2xl">
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
          Back to Problems
        </Link>
        <div className="mb-10">
          <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700 block mb-3">
            Result
          </span>
          <h1 className="font-sans text-[32px] font-bold tracking-[-0.035em] text-white leading-none mb-3">
            Submission
          </h1>
          <code className="font-mono-custom text-[10px] text-neutral-800 select-all">
            {id}
          </code>
        </div>
        <SubmissionStatus submissionId={id} />
      </div>
    </div>
  );
}