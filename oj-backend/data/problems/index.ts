import fs from "fs";
import path from "path";

export type Example = {
  input: string;
  output: string;
  explanation?: string;
};

export type TestCase = {
  input: string;
  expectedOutput: string;
  order: number;
  isHidden: boolean;
};

export type Problem = {
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  statement: string;
  constraints: string;
  examples: Example[];
  testCases: TestCase[];
  tags?: string[];
};

const dir = path.join(__dirname);

export const problems: Problem[] = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map(
    (f) =>
      JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")) as Problem
  )
  .sort((a, b) => a.title.localeCompare(b.title));