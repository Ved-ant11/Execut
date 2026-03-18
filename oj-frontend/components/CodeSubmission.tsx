"use client";
import toast from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import { submitSolution } from "@/lib/api";

export default function CodeSubmission({ questionId }: { questionId: string }) {
  const boilerplate: Record<string, string> = {
    javascript: `// Read input using readline()\n// All of stdin is also available as: input (string) and lines (array)\n\nconst line = readline();\nconsole.log(line);\n`,
    python: `# Read input using input()\n# Use sys.stdin for bulk reads\n\nline = input()\nprint(line)\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    string line;\n    getline(cin, line);\n    cout << line << endl;\n    return 0;\n}\n`,
  };

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(boilerplate["javascript"]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error("Code cannot be empty");
      return;
    }

    try {
      setLoading(true);
      const res = await submitSolution({
        code,
        language,
        questionId,
      });
      toast.success("Solution submitted successfully");
      router.push(`/submissions/${res.submissionId}`);
    } catch (err) {
      if (err instanceof Error && err.message === "Not authenticated") {
        toast.error("Not authenticated");
        router.push("/login");
      } else {
        toast.error("Failed to submit. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fileExtension =
    language === "javascript" ? "js" : language === "python" ? "py" : "cpp";

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={language}
              onChange={(e) => {
                const newLang = e.target.value;
                if (!code.trim() || Object.values(boilerplate).includes(code)) {
                  setCode(boilerplate[newLang] || "");
                }
                setLanguage(newLang);
              }}
              className="h-8 appearance-none rounded-md border border-neutral-800 bg-neutral-900 px-3 pr-7 text-xs font-medium text-neutral-300 outline-none transition-colors hover:border-neutral-700 focus:border-neutral-600 cursor-pointer"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 text-[10px]">
              ▾
            </span>
          </div>
          <span className="text-xs text-neutral-600 font-mono">
            solution.{fileExtension}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-md border border-neutral-800 overflow-hidden bg-[#1e1e1e]">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={(value) => setCode(value || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "var(--font-jetbrains-mono), monospace",
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            scrollBeyondLastLine: false,
            renderLineHighlight: "none",
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
            lineNumbers: "on",
            lineDecorationsWidth: 14,
            lineNumbersMinChars: 4,
            glyphMargin: false,
            folding: false,
          }}
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="shrink-0 flex h-9 w-full items-center justify-center rounded-md bg-neutral-100 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <svg
            className="h-4 w-4 animate-spin text-neutral-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeOpacity="0.2"
            />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          "Submit"
        )}
      </button>
    </div>
  );
}
