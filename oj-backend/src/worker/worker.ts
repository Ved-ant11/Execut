import redis, { connectRedis } from "../redis/client";
import prisma from "../db/client";
import { SubmissionStatus, Verdict } from "../generated/prisma/client";
import { judgeSubmission } from "./judge";
import { updateStreak } from "../utils/streak";

const QUEUE_KEY = "oj:submissions";

const MAX_ATTEMPTS = 3;
const RUNNING_TIMEOUT_MS = 2 * 60 * 1000;
const RECOVERY_INTERVAL_MS = 30 * 1000;

let isShuttingDown = false;

const log = (msg: string, data?: Record<string, unknown>) => {
  const ts = new Date().toISOString();
  if (data) {
    console.log(`[${ts}] [worker] ${msg}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${ts}] [worker] ${msg}`);
  }
};

const logError = (msg: string, err?: unknown) => {
  const ts = new Date().toISOString();
  console.error(`[${ts}] [worker] ERROR: ${msg}`, err);
};

const recoverStaleSubmissions = async () => {
  const stale = await prisma.submission.findMany({
    where: {
      status: SubmissionStatus.RUNNING,
      lastStartedAt: {
        lt: new Date(Date.now() - RUNNING_TIMEOUT_MS),
      },
    },
  });

  if (stale.length > 0) {
    log(`Found ${stale.length} stale submission(s) to recover`);
  }

  for (const sub of stale) {
    if (sub.attempts >= MAX_ATTEMPTS) {
      log(
        `Stale submission ${sub.id} exceeded max attempts (${sub.attempts}/${MAX_ATTEMPTS}), marking TLE`,
      );
      await prisma.submission.update({
        where: { id: sub.id },
        data: {
          status: SubmissionStatus.COMPLETED,
          verdict: Verdict.TLE,
          result: "System timeout - max attempts exceeded",
        },
      });
    } else {
      log(
        `Re-queuing stale submission ${sub.id} (attempt ${sub.attempts}/${MAX_ATTEMPTS})`,
      );
      await prisma.submission.update({
        where: { id: sub.id },
        data: {
          status: SubmissionStatus.QUEUED,
        },
      });

      await redis.lPush(QUEUE_KEY, sub.id);
    }
  }
};

const processSubmission = async (id: string) => {
  log(`Processing submission ${id}`);

  const claim = await prisma.submission.updateMany({
    where: {
      id,
      status: SubmissionStatus.QUEUED,
      attempts: { lt: MAX_ATTEMPTS },
    },
    data: {
      status: SubmissionStatus.RUNNING,
      attempts: { increment: 1 },
      lastStartedAt: new Date(),
    },
  });

  if (claim.count === 0) {
    log(
      `Could not claim submission ${id} — already running, completed, or max attempts reached`,
    );
    return;
  }

  const startTime = Date.now();

  try {
    const submission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      log(`Submission ${id} not found in DB after claiming`);
      return;
    }

    log(`Submission ${id} details:`, {
      language: submission.language,
      questionId: submission.questionId,
      codeLength: submission.code.length,
      attempt: submission.attempts,
    });

    const testCases = await prisma.testCase.findMany({
      where: { questionId: submission.questionId },
      orderBy: { order: "asc" },
    });

    log(
      `Found ${testCases.length} test case(s) for question ${submission.questionId}`,
      {
        timeLimits: testCases.map((tc) => tc.timeLimitMs),
      },
    );

    if (testCases.length === 0) {
      log(`WARNING: No test cases found for question ${submission.questionId}`);
      await prisma.submission.update({
        where: { id },
        data: {
          status: SubmissionStatus.COMPLETED,
          verdict: Verdict.RTE,
          result: "No test cases found for this problem",
        },
      });
      return;
    }

    log(
      `Starting judge for submission ${id} (language: ${submission.language})`,
    );
    const judgeStart = Date.now();

    const result = await judgeSubmission({
      language: submission.language,
      code: submission.code,
      testCases,
    });

    const judgeDuration = Date.now() - judgeStart;
    const totalDuration = Date.now() - startTime;

    log(`Judge completed for submission ${id}`, {
      verdict: result.verdict,
      message: result.message,
      failedTestCaseIndex: result.failedTestCaseIndex,
      judgeDurationMs: judgeDuration,
      totalDurationMs: totalDuration,
      ...(result.stderr ? { stderr: result.stderr.slice(0, 500) } : {}),
      ...(result.stdout ? { stdout: result.stdout.slice(0, 500) } : {}),
    });

    if (result.verdict === Verdict.WA && result.failedTestCaseIndex !== undefined) {
      const failedTC = testCases[result.failedTestCaseIndex];
      await prisma.submission.update({
        where: { id },
        data: {
          status: SubmissionStatus.COMPLETED,
          verdict: result.verdict,
          result: JSON.stringify({
            message: result.message,
            testCaseIndex: result.failedTestCaseIndex + 1,
            expected: failedTC.expectedOutput,
            actual: result.stdout || "",
            input: failedTC.isHidden ? null : failedTC.input,
          }),
        },
      });
    } else {
      //update for AC, TLE, RTE, CE
      await prisma.submission.update({
        where: { id },
        data: {
          status: SubmissionStatus.COMPLETED,
          verdict: result.verdict,
          result: result.message,
        },
      });
    }
    if (result.verdict === Verdict.AC) {
      log(`Submission ${id} got AC. Updating streak...`);
      try {
        await updateStreak(submission.userId);
      } catch (err) {
        logError(`Failed to update streak for user ${submission.userId}`, err);
      }
    }

    await redis.publish(`verdict:${id}`, JSON.stringify({
      status: SubmissionStatus.COMPLETED,
      verdict: result.verdict,
      result: result.message,
      code: submission.code,
      language: submission.language,
    }));

    log(
      `Submission ${id} saved — verdict: ${result.verdict} (${totalDuration}ms total)`,
    );
  } catch (err) {
    const totalDuration = Date.now() - startTime;
    logError(
      `Unhandled error processing submission ${id} after ${totalDuration}ms`,
      err,
    );

    await prisma.submission.update({
      where: { id },
      data: {
        status: SubmissionStatus.COMPLETED,
        verdict: Verdict.RTE,
        result: "Internal judge error",
      },
    });
  }
};

const worker = async () => {
  log("Worker starting...");
  await connectRedis();
  log("Redis connected");

  const recoveryTimer = setInterval(
    recoverStaleSubmissions,
    RECOVERY_INTERVAL_MS,
  );

  log("Worker ready — waiting for submissions on queue: " + QUEUE_KEY);

  while (!isShuttingDown) {
    try {
      const res = await redis.blPop(QUEUE_KEY, 5);
      if (!res?.element) continue;

      log(`Dequeued submission: ${res.element}`);
      await processSubmission(res.element);
    } catch (err) {
      logError("Worker loop error", err);
    }
  }

  log("Worker shutting down...");
  clearInterval(recoveryTimer);
  await redis.quit();
  await prisma.$disconnect();
  log("Worker shut down cleanly");
};

const shutdown = () => {
  log("Shutdown signal received...");
  isShuttingDown = true;
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

worker().catch((err) => {
  logError("Fatal worker error", err);
  process.exit(1);
});
