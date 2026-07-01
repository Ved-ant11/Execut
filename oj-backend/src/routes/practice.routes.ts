import { Router, Request, Response } from "express";
import tokenVerify from "../middleware/auth";
import prisma from "../db/client";
import {
  scheduler,
  createEmptyCard,
  dbToCard,
  cardToDb,
  RATING_MAP,
  getPreviewIntervals,
} from "../utils/fsrs";

const router = Router();

const DAILY_REVIEW_LIMIT = 12;

// GET /api/practice/review-queue
// Returns interleaved review queue (due cards, tags stripped, max 12/day)
router.get("/review-queue", tokenVerify, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const now = new Date();

    // Get today's start to count reviews done today
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    // Count reviews done today
    const reviewedToday = await prisma.reviewCard.count({
      where: {
        userId,
        lastReview: { gte: todayStart },
      },
    });

    const remaining = Math.max(0, DAILY_REVIEW_LIMIT - reviewedToday);
    if (remaining === 0) {
      return res.status(200).json({ cards: [], remaining: 0, message: "Daily limit reached" });
    }

    // Fetch due cards (more than we need for interleaving)
    const dueCards = await prisma.reviewCard.findMany({
      where: {
        userId,
        due: { lte: now },
      },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            tags: true,
          },
        },
      },
      orderBy: { due: "asc" },
      take: remaining * 3, // fetch extra for interleaving
    });

    // Interleave by primary tag (round-robin)
    const byTopic = new Map<string, typeof dueCards>();
    for (const card of dueCards) {
      const primaryTag = card.question.tags[0] || "Uncategorized";
      if (!byTopic.has(primaryTag)) {
        byTopic.set(primaryTag, []);
      }
      byTopic.get(primaryTag)!.push(card);
    }

    // Round-robin interleave
    const interleaved: typeof dueCards = [];
    const topicQueues = Array.from(byTopic.values());
    const topicIndices = new Array(topicQueues.length).fill(0);

    while (interleaved.length < remaining) {
      let added = false;
      for (let t = 0; t < topicQueues.length && interleaved.length < remaining; t++) {
        if (topicIndices[t] < topicQueues[t].length) {
          interleaved.push(topicQueues[t][topicIndices[t]]);
          topicIndices[t]++;
          added = true;
        }
      }
      if (!added) break;
    }

    // Build response — strip tags for interleaved practice
    const cards = interleaved.map((card) => {
      const fsrsCard = dbToCard(card);
      const previews = getPreviewIntervals(fsrsCard, now);

      return {
        id: card.id,
        questionId: card.question.id,
        title: card.question.title,
        difficulty: card.question.difficulty,
        // No tags — hidden during practice!
        state: card.state,
        reps: card.reps,
        previews, // { again: 0, hard: 1, good: 4, easy: 10 }
      };
    });

    return res.status(200).json({
      cards,
      remaining: remaining - cards.length,
      reviewedToday,
      totalDue: dueCards.length,
    });
  } catch (error) {
    console.error("Error fetching review queue:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/practice/retry-queue
// Returns failed-attempt problems for reattempting
router.get("/retry-queue", tokenVerify, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const retryItems = await prisma.retryQueue.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            tags: true,
          },
        },
      },
      orderBy: { lastAttemptAt: "desc" },
    });

    const items = retryItems.map((item) => ({
      id: item.id,
      questionId: item.question.id,
      title: item.question.title,
      difficulty: item.question.difficulty,
      tags: item.question.tags,
      lastVerdict: item.lastVerdict,
      attempts: item.attempts,
      lastAttemptAt: item.lastAttemptAt,
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Error fetching retry queue:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/practice/review
// Submit FSRS rating after reviewing a problem
router.post("/review", tokenVerify, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { questionId, rating } = req.body;

    if (!questionId || !rating) {
      return res.status(400).json({ error: "questionId and rating are required" });
    }

    const ratingEnum = RATING_MAP[rating.toLowerCase()];
    if (ratingEnum === undefined) {
      return res.status(400).json({ error: "Invalid rating. Use: again, hard, good, easy" });
    }

    // Check daily limit
    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const reviewedToday = await prisma.reviewCard.count({
      where: {
        userId,
        lastReview: { gte: todayStart },
      },
    });

    if (reviewedToday >= DAILY_REVIEW_LIMIT) {
      return res.status(429).json({ error: "Daily review limit reached" });
    }

    // Find the review card
    const reviewCard = await prisma.reviewCard.findUnique({
      where: {
        userId_questionId: { userId, questionId },
      },
    });

    if (!reviewCard) {
      return res.status(404).json({ error: "Review card not found" });
    }

    // Reconstruct card, run FSRS, save back
    const card = dbToCard(reviewCard);
    const result = scheduler.next(card, now, ratingEnum as any);
    const updatedData = cardToDb(result.card);

    await prisma.reviewCard.update({
      where: { id: reviewCard.id },
      data: {
        ...updatedData,
        totalReviews: { increment: 1 },
      },
    });

    return res.status(200).json({
      message: "Review recorded",
      nextDue: result.card.due,
      scheduledDays: result.card.scheduled_days,
      state: result.card.state,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/practice/stats
// Dashboard stats: due today, mastered, learning, retry count
router.get("/stats", tokenVerify, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    const [totalCards, dueNow, reviewedToday, masteredCards, learningCards, retryCount] =
      await Promise.all([
        prisma.reviewCard.count({ where: { userId } }),
        prisma.reviewCard.count({ where: { userId, due: { lte: now } } }),
        prisma.reviewCard.count({
          where: { userId, lastReview: { gte: todayStart } },
        }),
        // "Mastered" = in Review state (2) with stability > 21 days
        prisma.reviewCard.count({
          where: { userId, state: 2, stability: { gte: 21 } },
        }),
        // "Learning" = state 1 (Learning) or 3 (Relearning)
        prisma.reviewCard.count({
          where: { userId, state: { in: [0, 1, 3] } },
        }),
        prisma.retryQueue.count({ where: { userId } }),
      ]);

    return res.status(200).json({
      totalCards,
      dueNow,
      reviewedToday,
      dailyLimit: DAILY_REVIEW_LIMIT,
      remaining: Math.max(0, DAILY_REVIEW_LIMIT - reviewedToday),
      mastered: masteredCards,
      learning: learningCards,
      retryCount,
    });
  } catch (error) {
    console.error("Error fetching practice stats:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/practice/topics
// Topic mastery data for progress grid
router.get("/topics", tokenVerify, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Get all questions with their tags
    const allQuestions = await prisma.question.findMany({
      select: { id: true, tags: true },
    });

    // Get user's solved question IDs
    const solvedSubmissions = await prisma.submission.findMany({
      where: { userId, verdict: "AC" },
      select: { questionId: true },
      distinct: ["questionId"],
    });
    const solvedSet = new Set(solvedSubmissions.map((s) => s.questionId));

    // Get user's review cards for stability info
    const reviewCards = await prisma.reviewCard.findMany({
      where: { userId },
      select: { questionId: true, stability: true, state: true },
    });
    const cardMap = new Map(
      reviewCards.map((c) => [c.questionId, { stability: c.stability, state: c.state }])
    );

    // Build topic mastery map
    const topicMap = new Map<
      string,
      {
        total: number;
        solved: number;
        totalStability: number;
        stabilityCount: number;
      }
    >();

    for (const q of allQuestions) {
      const tags = q.tags.length > 0 ? q.tags : ["Uncategorized"];
      for (const tag of tags) {
        if (!topicMap.has(tag)) {
          topicMap.set(tag, { total: 0, solved: 0, totalStability: 0, stabilityCount: 0 });
        }
        const topic = topicMap.get(tag)!;
        topic.total++;
        if (solvedSet.has(q.id)) {
          topic.solved++;
        }
        const card = cardMap.get(q.id);
        if (card) {
          topic.totalStability += card.stability;
          topic.stabilityCount++;
        }
      }
    }

    // Convert to response
    const topics = Array.from(topicMap.entries())
      .map(([name, data]) => {
        const solveRate = data.total > 0 ? data.solved / data.total : 0;
        const avgStability =
          data.stabilityCount > 0 ? data.totalStability / data.stabilityCount : 0;

        let level: string;
        if (solveRate >= 0.75) level = "Mastered";
        else if (solveRate >= 0.5) level = "Proficient";
        else if (solveRate >= 0.25) level = "Familiar";
        else level = "Beginner";

        return {
          name,
          total: data.total,
          solved: data.solved,
          solveRate: Math.round(solveRate * 100),
          avgStability: Math.round(avgStability * 10) / 10,
          level,
        };
      })
      .sort((a, b) => b.total - a.total);

    return res.status(200).json({ topics });
  } catch (error) {
    console.error("Error fetching topic mastery:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/practice/retry/:questionId
// Remove a problem from the retry queue
router.delete("/retry/:questionId", tokenVerify, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { questionId } = req.params;

    await prisma.retryQueue.deleteMany({
      where: { userId, questionId },
    });

    return res.status(200).json({ message: "Removed from retry queue" });
  } catch (error) {
    console.error("Error removing from retry queue:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
