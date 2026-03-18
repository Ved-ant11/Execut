import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-neutral-100 overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,255,255,0.04),transparent)]" />
      <section className="relative z-10 mx-auto max-w-5xl px-8 md:px-16 pt-24 pb-32">

        <div className="inline-flex items-center gap-2.5 rounded-full border border-neutral-800/60 bg-[#0d0d0d] px-3.5 py-1.5 mb-12">
          <svg className="w-3 h-3 text-emerald-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-mono-custom text-[9.5px] tracking-[0.25em] uppercase text-neutral-500">
            Master Problem Solving, <span className="text-neutral-300">Not Patterns</span>
          </span>
        </div>

        <h1 className="font-sans text-[clamp(52px,9vw,100px)] font-bold leading-[0.92] tracking-[-0.04em] text-white">
          Improve your skills.<br />
          <span className="text-neutral-500">Get better.</span>
        </h1>

        <p className="font-mono-custom mt-8 text-[12px] font-light leading-[2] text-neutral-600 max-w-sm">
          Curated DSA problems with instant judge feedback.<br />
          Battle opponents. Compete in timed contests.
        </p>

        <div className="mt-10 flex items-center gap-5">
          <Link
            href="/problems"
            className="inline-flex items-center gap-2.5 h-10 px-6 bg-white text-[#0a0a0a] rounded-md font-mono-custom text-[11px] tracking-[0.12em] uppercase font-medium hover:bg-neutral-200 transition-colors duration-200"
          >
            Browse Problems
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/problems?difficulty=EASY"
            className="font-mono-custom text-[11px] tracking-[0.12em] uppercase text-neutral-700 hover:text-neutral-400 transition-colors duration-200"
          >
            Start easy →
          </Link>
        </div>
        <div className="mt-20 grid grid-cols-5 divide-x divide-neutral-800/60 border border-neutral-800/60 rounded-md w-fit overflow-hidden">
          {[
            { num: "150+",  label: "Problems"     },
            { num: "3",    label: "Difficulties" },
            { num: "3",    label: "Languages"    },
            { num: "1v1", label: "Battle Mode" },
            { num: "∞", label: "Custom Rooms" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center justify-center px-10 py-5 bg-[#0d0d0d]">
              <span className="font-sans text-[32px] font-bold text-white leading-none tracking-[-0.04em]">
                {s.num}
              </span>
              <span className="font-mono-custom text-[9px] tracking-[0.22em] text-neutral-700 uppercase mt-2.5">
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-2">
          {["Arrays", "Strings", "DP", "Trees", "Graphs", "Binary Search", "Sliding Window", "Backtracking"].map((t) => (
            <span
              key={t}
              className="font-mono-custom text-[9px] tracking-[0.15em] uppercase text-neutral-700 border border-neutral-800/70 rounded-full px-3 py-1 hover:border-neutral-600 hover:text-neutral-500 transition-colors duration-200 cursor-default"
            >
              {t}
            </span>
          ))}
        </div>

      </section>
      <div className="relative z-10 max-w-5xl mx-auto px-8 md:px-16">
        <div className="h-px bg-neutral-800/50" />
      </div>
      <section className="relative z-10 max-w-5xl mx-auto px-8 md:px-16 py-24">
        <div className="flex flex-col md:flex-row items-start gap-16">
          <div className="md:w-2/5 flex-shrink-0">
            <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700 block mb-5">
              Feature / 01
            </span>
            <h2 className="font-sans text-[clamp(36px,5vw,54px)] font-bold leading-[0.95] tracking-[-0.035em] text-white">
              1v1<br />Battle Mode
            </h2>
            <p className="font-mono-custom mt-6 text-[11px] font-light leading-[2] text-neutral-600 max-w-xs">
              Challenge any coder head-to-head. Same problem, same clock. First to pass all test cases wins.
            </p>
            <div className="mt-4 space-y-2">
              {["Real-time opponent progress", "Randomised problem selection", "Ranked matchmaking system"].map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <span className="w-1 h-1 rounded-full bg-neutral-600" />
                  <span className="font-mono-custom text-[10px] text-neutral-700">{f}</span>
                </div>
              ))}
            </div>
            <Link
              href="/battle"
              className="mt-8 inline-flex items-center gap-2 h-9 px-5 border border-neutral-700 rounded-md font-mono-custom text-[10px] tracking-[0.14em] uppercase text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-all duration-200"
            >
              Enter Arena →
            </Link>
          </div>
          <div className="md:w-3/5 w-full border border-neutral-800/60 rounded-lg bg-[#0d0d0d] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800/60 bg-[#0f0f0f]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
              </div>
              <span className="font-mono-custom text-[9px] tracking-[0.2em] uppercase text-neutral-700">
                battle / live
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-pulse" />
                <span className="font-mono-custom text-[9px] text-neutral-700">in progress</span>
              </div>
            </div>
            <div className="mx-5 mt-5 flex items-center justify-between px-4 py-3 border border-neutral-800/50 rounded-md bg-[#111111]">
              <div>
                <span className="font-mono-custom text-[8px] tracking-[0.2em] uppercase text-neutral-700 block mb-0.5">Problem</span>
                <span className="font-sans text-[14px] font-semibold text-neutral-300 tracking-tight">Longest Palindromic Substring</span>
              </div>
              <span className="font-mono-custom text-[9px] tracking-[0.15em] uppercase text-neutral-700 border border-neutral-800 rounded-full px-2.5 py-1">
                Medium
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 px-5 mt-3 mb-5">
              {[
                { handle: "user 1",   tests: 6, total: 8, pct: "75%",  bar: "bg-neutral-300" },
                { handle: "user 2", tests: 4, total: 8, pct: "50%",  bar: "bg-neutral-600" },
              ].map((p, i) => (
                <div key={p.handle} className="border border-neutral-800/50 rounded-md p-4 bg-[#111111]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center font-mono-custom text-[9px] text-neutral-500">
                      {i === 0 ? "A" : "B"}
                    </div>
                    <span className="font-mono-custom text-[10px] text-neutral-500">{p.handle}</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="font-mono-custom text-[8px] tracking-[0.15em] uppercase text-neutral-800">Tests</span>
                      <span className="font-mono-custom text-[11px] text-neutral-400">{p.tests} <span className="text-neutral-700">/ {p.total}</span></span>
                    </div>
                    <div className="h-px bg-neutral-800 rounded overflow-hidden">
                      <div className={`h-full ${p.bar} rounded transition-all`} style={{ width: p.pct }} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono-custom text-[8px] tracking-[0.15em] uppercase text-neutral-800">Elapsed</span>
                      <span className="font-mono-custom text-[11px] text-neutral-700 tabular-nums">08:42</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5">
              <div className="border border-neutral-800/50 rounded-md px-4 py-3 bg-[#111111]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-custom text-[8.5px] tracking-[0.18em] uppercase text-neutral-800">Time Remaining</span>
                  <span className="font-sans text-[22px] font-bold text-neutral-500 tracking-[-0.04em] tabular-nums">21:18</span>
                </div>
                <div className="h-px bg-neutral-800 rounded overflow-hidden">
                  <div className="h-full bg-neutral-600 rounded" style={{ width: "29%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="relative z-10 max-w-5xl mx-auto px-8 md:px-16">
        <div className="h-px bg-neutral-800/50" />
      </div>
      <section className="relative z-10 max-w-5xl mx-auto px-8 md:px-16 py-24">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700 block mb-5">
              Feature / 02
            </span>
            <h2 className="font-sans text-[clamp(36px,5vw,54px)] font-bold leading-[0.95] tracking-[-0.035em] text-white">
              Contests
            </h2>
            <p className="font-mono-custom mt-4 text-[11px] font-light leading-[2] text-neutral-600 max-w-sm">
              Timed. Ranked. Competitive. Test your skills against everyone on the platform simultaneously.
            </p>
          </div>
          <Link
            href="/contests"
            className="flex-shrink-0 inline-flex items-center gap-2 h-9 px-5 border border-neutral-700 rounded-md font-mono-custom text-[10px] tracking-[0.14em] uppercase text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-all duration-200"
          >
            All Contests →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              status: "Upcoming",
              dotColor: "bg-neutral-700",
              textColor: "text-neutral-700",
              name: "Weekly Contest #12",
              date: "Sat, 22 Jun — 9:00 PM IST",
              problems: "4",
              duration: "90 min",
              participants: "—",
            },
            {
              status: "Live",
              dotColor: "bg-neutral-300 animate-pulse",
              textColor: "text-neutral-400",
              name: "Biweekly Contest #6",
              date: "Today — Ends in 34m",
              problems: "4",
              duration: "90 min",
              participants: "218",
            },
            {
              status: "Ended",
              dotColor: "bg-neutral-800",
              textColor: "text-neutral-800",
              name: "Weekly Contest #11",
              date: "Sat, 15 Jun",
              problems: "4",
              duration: "90 min",
              participants: "341",
            },
          ].map((c) => (
            <div
              key={c.name}
              className="group border border-neutral-800/60 rounded-lg bg-[#0d0d0d] p-6 flex flex-col justify-between gap-8 hover:border-neutral-700/60 transition-colors duration-200"
            >
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dotColor}`} />
                  <span className={`font-mono-custom text-[9px] tracking-[0.2em] uppercase ${c.textColor}`}>
                    {c.status}
                  </span>
                </div>
                <h3 className="font-sans text-[16px] font-semibold text-neutral-300 tracking-[-0.02em] leading-snug">
                  {c.name}
                </h3>
                <p className="font-mono-custom text-[9.5px] text-neutral-700 mt-2">{c.date}</p>
              </div>
              <div className="space-y-2.5 border-t border-neutral-800/50 pt-5">
                {[
                  { label: "Problems",     val: c.problems     },
                  { label: "Duration",     val: c.duration     },
                  { label: "Participants", val: c.participants },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="font-mono-custom text-[8.5px] tracking-[0.15em] uppercase text-neutral-800">{row.label}</span>
                    <span className="font-mono-custom text-[10px] text-neutral-600">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="relative z-10 max-w-5xl mx-auto px-8 md:px-16">
        <div className="h-px bg-neutral-800/50" />
      </div>
      <section className="relative z-10 max-w-5xl mx-auto px-8 md:px-16 py-24 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
        <h2 className="font-sans text-[clamp(32px,4.5vw,52px)] font-bold leading-[0.95] tracking-[-0.035em] text-neutral-500 max-w-lg">
          Ready to write your{" "}
          <span className="text-white">first solution?</span>
        </h2>
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link
            href="/problems"
            className="inline-flex items-center gap-2.5 h-10 px-6 bg-white text-[#0a0a0a] rounded-md font-mono-custom text-[11px] tracking-[0.12em] uppercase font-medium hover:bg-neutral-200 transition-colors duration-200"
          >
            Get Started
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/battle"
            className="inline-flex items-center gap-2 h-10 px-5 border border-neutral-700 rounded-md font-mono-custom text-[11px] tracking-[0.12em] uppercase text-neutral-500 hover:border-neutral-500 hover:text-neutral-300 transition-all duration-200"
          >
            Battle →
          </Link>
        </div>
      </section>
      <footer className="relative z-10 border-t border-neutral-800/50 max-w-5xl mx-auto px-8 md:px-16 py-8 flex items-center justify-between">
        <span className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-800">
          © 2025 Execut.
        </span>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-800 animate-pulse" />
          <span className="font-mono-custom text-[9px] tracking-[0.18em] uppercase text-neutral-800">
            All systems operational
          </span>
        </div>
      </footer>

    </div>
  );
}