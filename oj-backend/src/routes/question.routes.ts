import { Router, Request, Response } from "express";
import prisma from "../db/client";
import tokenVerify from "../middleware/auth";
import { cached, invalidateCache } from "../redis/cache";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const questions = await cached("cache:questions:list", 60, () =>
      prisma.question.findMany({
        select: {
          id: true,
          title: true,
          difficulty: true,
          tags: true,
        },
      }),
    );

    return res.status(200).json(questions);
  } catch {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const question = await cached(`cache:questions:${id}`, 300, () =>
      prisma.question.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          difficulty: true,
          statement: true,
          examples: true,
          constraints: true,
          tags: true,
        },
      }),
    );

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    return res.status(200).json(question);
  } catch {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", tokenVerify, async (req: Request, res: Response) => {
  // try {
  //   const { title, difficulty, statement, examples, constraints, testCases } = req.body;

  //   if (!title || !difficulty || !statement) {
  //     return res.status(400).json({ error: "Missing required fields" });
  //   }

  //   const question = await prisma.question.create({
  //     data: {
  //       id: title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
  //       title,
  //       difficulty,
  //       statement,
  //       examples: examples || [],
  //       constraints: constraints || "",
  //     },
  //   });

  //   // Create test cases separately
  //   if (testCases && testCases.length > 0) {
  //     await prisma.testCase.createMany({
  //       data: testCases.map((tc: any, index: number) => ({
  //         questionId: question.id,
  //         input: tc.input,
  //         expectedOutput: tc.expectedOutput,
  //         isHidden: tc.isHidden || false,
  //         timeLimitMs: tc.timeLimitMs || 2000,
  //         order: index + 1,
  //       })),
  //     });
  //   }
  //   await invalidateCache("cache:questions:list");
  //   return res.status(201).json(question);
  // } catch {
  //   return res.status(500).json({ error: "Internal Server Error" });
  // }
  return res.status(403).json({ error: "Contribution is temporarily disabled for refinement" });
});

export default router;
