"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { getAuthHeaders } from "@/lib/api";

type Example  = { input: string; output: string; explanation: string };
type TestCase = { input: string; expectedOutput: string; isHidden: boolean; timeLimitMs: number };

export default function Contribute() {
  const [title, setTitle]             = useState("");
  const [difficulty, setDifficulty]   = useState("EASY");
  const [statement, setStatement]     = useState("");
  const [constraints, setConstraints] = useState("");
  const [examples, setExamples]       = useState<Example[]>([{ input: "", output: "", explanation: "" }]);
  const [testCases, setTestCases]     = useState<TestCase[]>([{ input: "", expectedOutput: "", isHidden: false, timeLimitMs: 2000 }]);
  const [submitting, setSubmitting]   = useState(false);

  const updateExample  = (index: number, field: keyof Example, value: string) => {
    const updated = [...examples];
    updated[index] = { ...updated[index], [field]: value };
    setExamples(updated);
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: string | boolean | number) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
  };

  const removeExample  = (index: number) => setExamples(examples.filter((_, i) => i !== index));
  const removeTestCase = (index: number) => setTestCases(testCases.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !statement.trim()) { toast.error("Title and statement are required"); return; }
    if (testCases.length === 0) { toast.error("At least one test case is required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/questions`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ title, difficulty, statement, constraints, examples, testCases }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit problem");
      }
      toast.success("Problem submitted successfully!");
      setTitle(""); setDifficulty("EASY"); setStatement(""); setConstraints("");
      setExamples([{ input: "", output: "", explanation: "" }]);
      setTestCases([{ input: "", expectedOutput: "", isHidden: false, timeLimitMs: 2000 }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 bg-[#0d0d0d] border border-neutral-800/60 hover:border-neutral-700 focus:border-neutral-600 rounded-md font-mono-custom text-[12px] text-neutral-300 placeholder:text-neutral-800 outline-none transition-colors duration-200 resize-none";

  const labelClass = "font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700 block mb-2";

  return (
    <div className="mx-auto max-w-screen-xl px-8 py-14">

      <div className="max-w-2xl">

        {/* Header */}
        <div className="mb-12">
          <span className="font-mono-custom text-[9px] tracking-[0.28em] uppercase text-neutral-700 block mb-3">
            Community
          </span>
          <h1 className="font-sans text-[32px] font-bold tracking-[-0.035em] text-white leading-none mb-2">
            Contribute
          </h1>
          <p className="font-mono-custom text-[11px] text-neutral-700">
            Help grow the problem set for everyone on the platform.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Title + Difficulty */}
          <div className="grid grid-cols-[1fr_160px] gap-4">
            <div>
              <label className={labelClass}>Title</label>
              <input
                type="text"
                placeholder="e.g. Two Sum"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{ colorScheme: "dark" }}
                className={inputClass + " cursor-pointer"}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          {/* Statement */}
          <div>
            <label className={labelClass}>Problem Statement</label>
            <textarea
              rows={6}
              placeholder="Describe the problem clearly. You can use markdown."
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Constraints */}
          <div>
            <label className={labelClass}>Constraints</label>
            <textarea
              rows={3}
              placeholder={"e.g.\n- 1 ≤ n ≤ 10⁴\n- -10⁹ ≤ nums[i] ≤ 10⁹"}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-neutral-800/50" />

          {/* Examples */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <label className={labelClass + " mb-0"}>Examples</label>
              <button
                type="button"
                onClick={() => setExamples([...examples, { input: "", output: "", explanation: "" }])}
                className="font-mono-custom text-[9px] tracking-[0.18em] uppercase text-neutral-600 hover:text-neutral-300 border-b border-neutral-800 hover:border-neutral-600 pb-px transition-colors duration-200"
              >
                + Add Example
              </button>
            </div>
            <div className="space-y-3">
              {examples.map((ex, i) => (
                <div key={i} className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-custom text-[9px] tracking-[0.2em] uppercase text-neutral-700">
                      Example {i + 1}
                    </span>
                    {examples.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExample(i)}
                        className="font-mono-custom text-[9px] tracking-[0.15em] uppercase text-neutral-700 hover:text-red-500 transition-colors duration-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    placeholder="Input — e.g. nums = [2,7,11,15], target = 9"
                    value={ex.input}
                    onChange={(e) => updateExample(i, "input", e.target.value)}
                    className={inputClass}
                  />
                  <input
                    placeholder="Output — e.g. [0,1]"
                    value={ex.output}
                    onChange={(e) => updateExample(i, "output", e.target.value)}
                    className={inputClass}
                  />
                  <input
                    placeholder="Explanation (optional)"
                    value={ex.explanation}
                    onChange={(e) => updateExample(i, "explanation", e.target.value)}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-neutral-800/50" />

          {/* Test Cases */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <label className={labelClass + " mb-0"}>Test Cases</label>
              <button
                type="button"
                onClick={() => setTestCases([...testCases, { input: "", expectedOutput: "", isHidden: false, timeLimitMs: 2000 }])}
                className="font-mono-custom text-[9px] tracking-[0.18em] uppercase text-neutral-600 hover:text-neutral-300 border-b border-neutral-800 hover:border-neutral-600 pb-px transition-colors duration-200"
              >
                + Add Test Case
              </button>
            </div>
            <div className="space-y-3">
              {testCases.map((tc, i) => (
                <div key={i} className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-custom text-[9px] tracking-[0.2em] uppercase text-neutral-700">
                      Test Case {i + 1}
                    </span>
                    {testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestCase(i)}
                        className="font-mono-custom text-[9px] tracking-[0.15em] uppercase text-neutral-700 hover:text-red-500 transition-colors duration-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Input (exactly as stdin)"
                    value={tc.input}
                    onChange={(e) => updateTestCase(i, "input", e.target.value)}
                    className={inputClass}
                  />
                  <textarea
                    rows={2}
                    placeholder="Expected Output (exactly as stdout)"
                    value={tc.expectedOutput}
                    onChange={(e) => updateTestCase(i, "expectedOutput", e.target.value)}
                    className={inputClass}
                  />
                  <div className="flex items-center gap-6 pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={tc.isHidden}
                        onChange={(e) => updateTestCase(i, "isHidden", e.target.checked)}
                        className="w-3.5 h-3.5 accent-neutral-400 cursor-pointer"
                      />
                      <span className="font-mono-custom text-[10px] tracking-[0.15em] uppercase text-neutral-700 group-hover:text-neutral-500 transition-colors duration-200">
                        Hidden
                      </span>
                    </label>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono-custom text-[10px] tracking-[0.15em] uppercase text-neutral-700">
                        Time Limit
                      </span>
                      <input
                        type="number"
                        value={tc.timeLimitMs}
                        onChange={(e) => updateTestCase(i, "timeLimitMs", Number(e.target.value))}
                        className="w-20 px-2.5 py-1.5 bg-[#111111] border border-neutral-800/60 hover:border-neutral-700 focus:border-neutral-600 rounded-md font-mono-custom text-[11px] text-neutral-400 outline-none transition-colors duration-200"
                      />
                      <span className="font-mono-custom text-[9px] tracking-[0.18em] uppercase text-neutral-800">ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2.5 h-11 px-8 bg-white text-[#0a0a0a] rounded-md font-mono-custom text-[11px] tracking-[0.14em] uppercase font-medium hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                Submit Problem
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}