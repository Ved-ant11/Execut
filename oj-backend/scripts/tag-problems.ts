/**
 * Tag all problems with DSA topic tags.
 * 
 * Usage: npx ts-node scripts/tag-problems.ts
 * 
 * This script:
 * 1. Maps each problem ID to relevant topic tags
 * 2. Updates the JSON files in data/problems/
 * 3. Updates the database via Prisma
 */

import fs from "fs";
import path from "path";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not found");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Comprehensive tag mapping for all 195 problems
const TAG_MAP: Record<string, string[]> = {
  // === ARRAYS / FUNDAMENTALS ===
  "two-sum": ["Arrays", "Hash Map"],
  "contains-duplicate": ["Arrays", "Hash Map"],
  "reverse-string": ["Strings"],
  "palindrome-number": ["Math"],
  "fizzbuzz": ["Math", "Strings"],
  "power-of-two": ["Math", "Bit Manipulation"],
  "missing-number": ["Arrays", "Math"],
  "move-zeros": ["Arrays", "Two Pointers"],
  "check-sorted-array": ["Arrays"],
  "count-vowels": ["Strings"],
  "count-words": ["Strings"],
  "sum-of-digits": ["Math"],
  "number-to-words-simple": ["Math", "Strings"],
  "second-largest": ["Arrays"],

  // === STRINGS ===
  "valid-anagram": ["Strings", "Hash Map"],
  "longest-common-prefix": ["Strings"],
  "compress-string": ["Strings"],
  "decode-run-length": ["Strings"],
  "group-anagrams-count": ["Strings", "Hash Map"],
  "first-non-repeating-char": ["Strings", "Hash Map"],
  "roman-to-integer": ["Strings", "Math"],
  "longest-substring-no-repeat": ["Strings", "Sliding Window", "Hash Map"],
  "group-shifted-strings": ["Strings", "Hash Map"],
  "string-compression-k": ["Strings", "Dynamic Programming"],

  // === ARRAYS / TWO POINTERS ===
  "container-with-most-water": ["Arrays", "Two Pointers"],
  "three-sum-target": ["Arrays", "Two Pointers", "Sorting"],
  "intersection-two-arrays": ["Arrays", "Hash Map"],
  "product-except-self": ["Arrays", "Prefix Sum"],
  "rotate-array": ["Arrays"],
  "find-all-duplicates": ["Arrays", "Hash Map"],
  "rearrange-array-by-sign": ["Arrays"],
  "equilibrium-index": ["Arrays", "Prefix Sum"],
  "largest-number-from-array": ["Arrays", "Sorting"],
  "array-chunk": ["Arrays"],
  "flatten-nested-array": ["Arrays", "Recursion"],
  "digit-frequency-map": ["Hash Map"],

  // === SORTING ===
  "minimum-swaps-to-sort": ["Sorting", "Arrays"],
  "frequency-sort-stability": ["Sorting", "Hash Map"],
  "count-inversions": ["Sorting", "Divide and Conquer"],

  // === BINARY SEARCH ===
  "binary-search": ["Binary Search"],
  "peak-index-mountain": ["Binary Search"],
  "integer-square-root": ["Binary Search", "Math"],
  "count-occurrences-sorted-array": ["Binary Search", "Arrays"],
  "allocate-minimum-pages": ["Binary Search", "Greedy"],
  "ship-packages-within-days": ["Binary Search", "Greedy"],
  "smallest-divisor-threshold": ["Binary Search"],
  "split-array-largest-sum": ["Binary Search", "Dynamic Programming"],
  "median-two-sorted-arrays": ["Binary Search", "Arrays"],
  "kth-smallest-sorted-matrix": ["Binary Search", "Heap"],
  "min-max-job-partition": ["Binary Search", "Greedy"],

  // === STACK / QUEUE ===
  "valid-parentheses": ["Stack"],
  "next-greater-element": ["Stack"],
  "balanced-parentheses-score": ["Stack"],
  "largest-rectangle-histogram": ["Stack"],
  "largest-rectangle-histogram-query": ["Stack", "Arrays"],
  "nesting-depth": ["Stack"],
  "bracket-depth-sum": ["Stack", "Math"],

  // === SLIDING WINDOW ===
  "minimum-window-substring": ["Sliding Window", "Hash Map"],
  "longest-ones-one-flip": ["Sliding Window"],
  "count-subarrays-k-distinct": ["Sliding Window", "Hash Map"],
  "subarrays-product-less-k": ["Sliding Window"],
  "min-window-all-distinct": ["Sliding Window", "Hash Map"],
  "min-window-all-distinct-2": ["Sliding Window", "Hash Map"],
  "max-frequency-after-k-ops": ["Sliding Window", "Sorting"],
  "sliding-window-maximum": ["Sliding Window", "Queue"],
  "min-swaps-bring-together": ["Sliding Window", "Arrays"],
  "minimum-swaps-k-together": ["Sliding Window", "Arrays"],
  "longest-subarray-abs-diff": ["Sliding Window", "Queue"],

  // === HASH MAP / PREFIX SUM ===
  "subarray-sum-equals-k": ["Hash Map", "Prefix Sum"],
  "subarray-sum-k": ["Hash Map", "Prefix Sum"],
  "subarrays-divisible-by-k": ["Hash Map", "Prefix Sum"],
  "largest-zero-sum-subarray": ["Hash Map", "Prefix Sum"],
  "longest-subarray-equal-01": ["Hash Map", "Prefix Sum"],
  "count-xor-subarrays": ["Hash Map", "Prefix Sum", "Bit Manipulation"],
  "top-k-frequent": ["Hash Map", "Heap"],
  "count-range-sum": ["Prefix Sum", "Divide and Conquer"],

  // === DYNAMIC PROGRAMMING ===
  "climbing-stairs": ["Dynamic Programming"],
  "climb-stairs-3-steps": ["Dynamic Programming"],
  "minimum-cost-stair-climbing": ["Dynamic Programming"],
  "coin-change-minimum": ["Dynamic Programming"],
  "longest-increasing-subsequence": ["Dynamic Programming", "Binary Search"],
  "edit-distance": ["Dynamic Programming", "Strings"],
  "zero-one-knapsack": ["Dynamic Programming"],
  "partition-equal-subset-sum": ["Dynamic Programming"],
  "max-non-adjacent-sum": ["Dynamic Programming"],
  "maximum-subarray": ["Dynamic Programming", "Arrays"],
  "maximum-product-subarray": ["Dynamic Programming", "Arrays"],
  "max-sum-circular-subarray": ["Dynamic Programming", "Arrays"],
  "buy-sell-stock": ["Dynamic Programming", "Arrays"],
  "max-profit-cooldown": ["Dynamic Programming"],
  "stock-trading-cooldown": ["Dynamic Programming"],
  "stock-buy-sell-k-transactions": ["Dynamic Programming"],
  "longest-pair-chain": ["Dynamic Programming", "Greedy"],
  "decode-ways-count": ["Dynamic Programming", "Strings"],
  "decode-ways-wildcard": ["Dynamic Programming", "Strings"],
  "number-of-ways-to-decode": ["Dynamic Programming", "Strings"],
  "count-subsets-given-sum": ["Dynamic Programming"],
  "unique-paths-obstacles": ["Dynamic Programming", "Matrix"],
  "min-cost-grid-path": ["Dynamic Programming", "Matrix"],
  "path-sum-with-obstacles": ["Dynamic Programming", "Matrix"],
  "constrained-grid-paths": ["Dynamic Programming", "Matrix"],
  "paths-in-grid-k-steps": ["Dynamic Programming", "Matrix"],
  "matrix-chain-multiplication": ["Dynamic Programming"],
  "matrix-chain-order": ["Dynamic Programming"],
  "palindrome-partitioning-min-cuts": ["Dynamic Programming", "Strings"],
  "count-palindrome-partitions": ["Dynamic Programming", "Strings"],
  "min-insertions-to-palindrome": ["Dynamic Programming", "Strings"],
  "regular-expression-match": ["Dynamic Programming", "Strings"],
  "wildcard-pattern-matching": ["Dynamic Programming", "Strings"],
  "word-break": ["Dynamic Programming", "Strings"],
  "dice-throw-count-ways": ["Dynamic Programming"],
  "egg-drop-problem": ["Dynamic Programming"],
  "fence-coloring": ["Dynamic Programming"],
  "tile-2xn-with-dominoes": ["Dynamic Programming"],
  "tiling-board": ["Dynamic Programming"],
  "longest-turbulent-subarray": ["Dynamic Programming", "Arrays"],
  "min-cost-cut-stick": ["Dynamic Programming"],
  "stone-merge-cost": ["Dynamic Programming"],
  "weighted-job-scheduling": ["Dynamic Programming", "Binary Search", "Sorting"],
  "min-cost-climb-with-breaks": ["Dynamic Programming"],
  "frog-jump-k-pads": ["Dynamic Programming"],
  "subsequence-width": ["Dynamic Programming", "Math", "Sorting"],
  "alternating-parity-subsequence": ["Dynamic Programming", "Arrays"],
  "max-sum-rectangle-no-larger-than-k": ["Dynamic Programming", "Matrix", "Binary Search"],
  "maximum-path-two-players": ["Dynamic Programming", "Matrix"],
  "score-sequence": ["Dynamic Programming"],

  // === GREEDY ===
  "jump-game-minimum": ["Greedy", "Arrays"],
  "can-jump-trampoline": ["Greedy", "Arrays"],
  "minimum-jumps-to-end": ["Greedy", "Arrays"],
  "gas-station-tour": ["Greedy", "Arrays"],
  "circular-gas-station": ["Greedy", "Arrays"],
  "task-scheduler": ["Greedy", "Heap"],
  "task-scheduler-cooldown": ["Greedy", "Hash Map"],
  "meeting-rooms-minimum": ["Greedy", "Intervals", "Sorting"],
  "min-arrows-burst-balloons": ["Greedy", "Intervals", "Sorting"],
  "candy-redistribution": ["Greedy", "Arrays"],
  "minimum-deletions-unique-freq": ["Greedy", "Hash Map", "Sorting"],
  "min-ops-make-array-equal": ["Greedy", "Math"],
  "minimum-platforms": ["Greedy", "Intervals", "Sorting"],
  "partition-labels-merge": ["Greedy", "Intervals"],
  "token-balance-game": ["Greedy", "Sorting"],
  "balanced-split-cost": ["Greedy", "Prefix Sum"],
  "run-length-score": ["Greedy", "Strings"],

  // === GRAPHS / BFS / DFS ===
  "number-of-islands": ["Graphs", "BFS", "DFS", "Matrix"],
  "number-distinct-islands": ["Graphs", "DFS", "Matrix"],
  "shortest-path-binary-matrix": ["Graphs", "BFS", "Matrix"],
  "word-ladder-length": ["Graphs", "BFS"],
  "alien-dictionary": ["Graphs", "Topological Sort"],
  "bus-routes-minimum": ["Graphs", "BFS"],
  "bus-route-hops": ["Graphs", "BFS"],
  "grid-infection-spread": ["Graphs", "BFS", "Matrix"],
  "grid-teleport-shortest-path": ["Graphs", "BFS", "Matrix"],
  "shortest-path-alternating-colors": ["Graphs", "BFS"],
  "crumbling-network": ["Graphs", "Union Find"],
  "network-reliability": ["Graphs", "DFS"],
  "virus-containment": ["Graphs", "BFS", "DFS"],
  "exam-schedule": ["Graphs", "BFS"],
  "interval-graph-coloring": ["Graphs", "Greedy"],
  "sequence-reconstruction-unique": ["Graphs", "Topological Sort"],
  "signal-amplifier": ["Graphs", "BFS"],
  "xor-spanning-tree": ["Graphs", "Trees"],
  "reachable-cells-jump": ["Graphs", "BFS"],
  "minimum-jumps-forbidden": ["Graphs", "BFS"],
  "minimum-steps-to-zero": ["Graphs", "BFS"],
  "longest-decreasing-path-grid": ["Graphs", "DFS", "Dynamic Programming", "Matrix"],
  "paint-minimum-strokes": ["Graphs", "BFS", "Matrix"],

  // === TREES ===
  "count-pairs-bst-sum": ["Trees", "Two Pointers"],
  "serialize-deserialize-bst": ["Trees", "Strings"],
  "number-compression-tree": ["Trees", "Recursion"],

  // === HEAP / PRIORITY QUEUE ===
  "k-closest-points": ["Heap", "Sorting"],
  "median-from-data-stream": ["Heap"],
  "min-cost-connect-ropes": ["Heap", "Greedy"],
  "max-points-from-k-operations": ["Heap", "Greedy"],
  "minimum-interval-query": ["Heap", "Sorting", "Intervals"],

  // === MATH / BIT MANIPULATION ===
  "fast-power": ["Math", "Recursion"],
  "tower-of-hanoi-moves": ["Math", "Recursion"],
  "josephus-problem": ["Math", "Recursion"],
  "maximum-xor-queries": ["Bit Manipulation", "Trie"],
  "max-points-on-line": ["Math", "Hash Map"],
  "letter-combinations-count": ["Math", "Recursion"],
  "robot-bounded-circle": ["Math"],

  // === MATRIX ===
  "spiral-matrix": ["Matrix"],
  "rotate-image-90": ["Matrix"],
  "zero-matrix": ["Matrix"],
  "binary-matrix-rank": ["Matrix", "Math"],
  "spiral-diagonal-sum": ["Matrix", "Math"],

  // === TRIE ===
  // (covered by maximum-xor-queries above)

  // === MISC / MULTI-TOPIC ===
  "trapping-rain-water": ["Arrays", "Two Pointers", "Stack"],
  "card-shuffle-check": ["Arrays", "Sorting"],
  "concert-seating": ["Greedy", "Sorting"],
  "domino-chain": ["Dynamic Programming", "Greedy"],
  "stone-game-ends": ["Dynamic Programming", "Math"],
  "warehouse-robot-tour": ["Greedy", "Arrays"],
  "weighted-stock-span": ["Stack", "Arrays"],
  "zero-array-operations": ["Prefix Sum", "Arrays"],
  "alternating-sign-array": ["Arrays", "Math"],
};

async function main() {
  const problemsDir = path.join(__dirname, "..", "data", "problems");
  const files = fs.readdirSync(problemsDir).filter((f) => f.endsWith(".json"));

  let tagged = 0;
  let untagged = 0;

  for (const file of files) {
    const filePath = path.join(problemsDir, file);
    const problem = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const id = problem.id;

    const tags = TAG_MAP[id];
    if (tags) {
      problem.tags = tags;
      fs.writeFileSync(filePath, JSON.stringify(problem, null, 2) + "\n");
      tagged++;

      // Update in database
      try {
        await prisma.question.update({
          where: { id },
          data: { tags },
        });
      } catch {
        // Question might not exist in DB yet — that's fine
        console.log(`  ⚠ Question ${id} not in DB yet, will be tagged on next seed`);
      }
    } else {
      untagged++;
      console.log(`  ⚠ No tags defined for: ${id}`);
    }
  }

  console.log(`\nTagging complete: ${tagged} tagged, ${untagged} untagged out of ${files.length} problems`);
}

main()
  .catch((e) => {
    console.error("Tagging failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
