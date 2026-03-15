import fs from "fs";
import path from "path";

const slug = process.argv[2];

if (!slug) {
  console.error("Usage: npx ts-node scripts/new-problem.ts <slug>");
  console.error("Example: npx ts-node scripts/new-problem.ts longest-palindromic-substring");
  process.exit(1);
}

const title = slug
  .split("-")
  .map((w) => w[0].toUpperCase() + w.slice(1))
  .join(" ");

const template = {
  id: slug,
  title,
  difficulty: "EASY",
  statement: "TODO: problem statement",
  constraints: "TODO: constraints",
  examples: [
    { input: "TODO", output: "TODO", explanation: "TODO" },
  ],
  testCases: [
    { input: "TODO", expectedOutput: "TODO", order: 1, isHidden: false },
    { input: "TODO", expectedOutput: "TODO", order: 2, isHidden: false },
    { input: "TODO", expectedOutput: "TODO", order: 3, isHidden: true },
    { input: "TODO", expectedOutput: "TODO", order: 4, isHidden: true },
    { input: "TODO", expectedOutput: "TODO", order: 5, isHidden: true },
  ],
};

const dest = path.join(__dirname, "../data/problems", `${slug}.json`);
fs.writeFileSync(dest, JSON.stringify(template, null, 2));
console.log(`✅ Created: data/problems/${slug}.json`);
console.log(`   Fill in the TODOs, then run: npx prisma db seed`);