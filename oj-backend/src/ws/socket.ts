import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { createClient } from "redis";
import { judgeSubmission } from "../worker/judge";
import prisma from "../db/client";
import { Verdict, SubmissionStatus } from "../generated/prisma/client";
import { calculateNewRating } from "../utils/elo";
import { updateStreak } from "../utils/streak";

type BattleRoom = {
  player1: WebSocket | null;
  player1Id: string;
  player2: WebSocket | null;
  player2Id: string | null;
  timer: NodeJS.Timeout | null;
  startTime: number;
  p1Duration: number;
  p2Duration: number;
  questionId: string;
  battlePlayer1Id: string;
  battlePlayer2Id: string;
  p1LastSubmitTime: number;
  p2LastSubmitTime: number;
  p1DisconnectTimer: NodeJS.Timeout | null;
  p2DisconnectTimer: NodeJS.Timeout | null;
};

const BASE_DURATION = 1200000; // 20 minutes

function getEffectiveTimeout(room: BattleRoom): number {
  return Math.max(room.p1Duration, room.p2Duration);
}

function rescheduleTimer(
  room: BattleRoom,
  battleId: string,
  battleRooms: Map<string, BattleRoom>,
) {
  if (room.timer) clearTimeout(room.timer);

  const elapsed = Date.now() - room.startTime;
  const maxDuration = getEffectiveTimeout(room);
  const remaining = maxDuration - elapsed;

  if (remaining <= 0) {
    handleTimeout(room, battleId, battleRooms);
    return;
  }

  room.timer = setTimeout(() => {
    handleTimeout(room, battleId, battleRooms);
  }, remaining);
}

async function handleTimeout(
  room: BattleRoom,
  battleId: string,
  battleRooms: Map<string, BattleRoom>,
) {
  if (room.timer) clearTimeout(room.timer);
  room.timer = null;

  try {
    // Mark battle as completed with no winner (draw/timeout)
    await prisma.battle.update({
      where: { id: battleId },
      data: {
        status: "COMPLETED",
        endedAt: new Date(),
      },
    });

    // On timeout both players lose — no Elo change, just increment battlesPlayed
    if (room.battlePlayer1Id && room.battlePlayer2Id) {
      await Promise.all([
        prisma.user.update({
          where: { id: room.battlePlayer1Id },
          data: { battlesPlayed: { increment: 1 } },
        }),
        prisma.user.update({
          where: { id: room.battlePlayer2Id },
          data: { battlesPlayed: { increment: 1 } },
        }),
      ]);
    }

    const timeoutMsg = JSON.stringify({ type: "battle:timeout", battleId });
    if (room.player1?.readyState === WebSocket.OPEN)
      room.player1.send(timeoutMsg);
    if (room.player2?.readyState === WebSocket.OPEN)
      room.player2.send(timeoutMsg);
  } catch (err) {
    console.error(`[ws] Error handling timeout for battle ${battleId}:`, err);
  }

  battleRooms.delete(battleId);
}

function isRoomPlayer1(room: BattleRoom, userId: string): boolean {
  return room.battlePlayer1Id === userId;
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });
  const clients = new Map<string, WebSocket>();
  const battleRooms = new Map<string, BattleRoom>();
  const wsMetadata = new Map<WebSocket, { battleId: string; userId: string }>();

  const DISCONNECT_GRACE_MS = 30000;

  async function handleDisconnectForfeit(
    battleId: string,
    odisconnectedUserId: string,
  ) {
    const room = battleRooms.get(battleId);
    if (!room) return;

    const isPlayer1 = room.battlePlayer1Id === odisconnectedUserId;
    const reconnected = isPlayer1 ? room.player1 : room.player2;
    if (reconnected !== null) return;

    if (room.timer) clearTimeout(room.timer);
    room.timer = null;

    if (room.startTime === 0) {
      await prisma.battle.update({
        where: { id: battleId },
        data: { status: "ABANDONED", endedAt: new Date() },
      });
      battleRooms.delete(battleId);
      return;
    }

    const winnerId = isPlayer1 ? room.battlePlayer2Id : room.battlePlayer1Id;

    await prisma.battle.update({
      where: { id: battleId },
      data: {
        status: "ABANDONED",
        winnerId,
        endedAt: new Date(),
      },
    });

    const [winner, loser] = await Promise.all([
      prisma.user.findUnique({ where: { id: winnerId } }),
      prisma.user.findUnique({ where: { id: odisconnectedUserId } }),
    ]);

    if (winner && loser) {
      const { winnerNew, loserNew } = calculateNewRating(
        winner.rating,
        loser.rating,
        winner.battlesPlayed,
        loser.battlesPlayed,
      );

      await Promise.all([
        prisma.user.update({
          where: { id: winner.id },
          data: {
            rating: winnerNew,
            battlesPlayed: { increment: 1 },
            battlesWon: { increment: 1 },
          },
        }),
        prisma.user.update({
          where: { id: loser.id },
          data: { rating: loserNew, battlesPlayed: { increment: 1 } },
        }),
      ]);

      const opponent = isPlayer1 ? room.player2 : room.player1;
      if (opponent?.readyState === WebSocket.OPEN) {
        opponent.send(
          JSON.stringify({
            type: "battle:result",
            battleId,
            won: true,
            eloChange: winnerNew - winner.rating,
            newRating: winnerNew,
            reason: "opponent_disconnected",
          }),
        );
      }
    }

    battleRooms.delete(battleId);
  }

  wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", async (data) => {
      let message: any;
      try {
        message = JSON.parse(data.toString());
      } catch {
        return;
      }
      if (message.type === "battle:join") {
        const { battleId, userId } = message;
        if (!battleId || !userId) return;

        wsMetadata.set(ws, { battleId, userId });

        let room = battleRooms.get(battleId);

        if (!room) {
          const battle = await prisma.battle.findUnique({
            where: { id: battleId },
            select: { player1Id: true, player2Id: true, questionId: true, status: true },
          });
          if (!battle) {
            ws.send(JSON.stringify({ type: "error", message: "Battle not found" }));
            return;
          }
          if (battle.status === "COMPLETED" || battle.status === "ABANDONED") {
            ws.send(JSON.stringify({ type: "error", message: "Battle already ended" }));
            return;
          }
          if (userId !== battle.player1Id && userId !== battle.player2Id) {
            ws.send(JSON.stringify({ type: "error", message: "Not a participant" }));
            return;
          }

          battleRooms.set(battleId, {
            player1: null,
            player1Id: "",
            player2: null,
            player2Id: "",
            timer: null,
            startTime: 0,
            p1Duration: BASE_DURATION,
            p2Duration: BASE_DURATION,
            questionId: battle.questionId,
            battlePlayer1Id: battle.player1Id,
            battlePlayer2Id: battle.player2Id,
            p1LastSubmitTime: 0,
            p2LastSubmitTime: 0,
            p1DisconnectTimer: null,
            p2DisconnectTimer: null,
          });
          room = battleRooms.get(battleId)!;
        }

        if (userId !== room.battlePlayer1Id && userId !== room.battlePlayer2Id) {
          ws.send(JSON.stringify({ type: "error", message: "Not a participant in this battle" }));
          return;
        }

        const isP1 = userId === room.battlePlayer1Id;
        if (isP1) {
          room.player1 = ws;
          room.player1Id = userId;
          if (room.p1DisconnectTimer) {
            clearTimeout(room.p1DisconnectTimer);
            room.p1DisconnectTimer = null;
          }
        } else {
          room.player2 = ws;
          room.player2Id = userId;
          if (room.p2DisconnectTimer) {
            clearTimeout(room.p2DisconnectTimer);
            room.p2DisconnectTimer = null;
          }
        }

        if (room.startTime > 0) {
          // Battle already started (reconnect)
          ws.send(
            JSON.stringify({
              type: "battle:start",
              battleId,
              startTime: room.startTime,
              duration: isP1 ? room.p1Duration : room.p2Duration,
            })
          );
        } else if (room.player1 && room.player2) {
          // Both players connected, start countdown if not already counting down
          if (room.startTime === 0) {
            room.startTime = -1; // Indicate countdown in progress to prevent duplicates

            const countdown = JSON.stringify({ type: "battle:countdown", seconds: 3 });
            if (room.player1?.readyState === WebSocket.OPEN) room.player1.send(countdown);
            if (room.player2?.readyState === WebSocket.OPEN) room.player2.send(countdown);

            const roomRef = room;
            setTimeout(async () => {
              roomRef.startTime = Date.now();

              try {
                await prisma.battle.update({
                  where: { id: battleId },
                  data: { startedAt: new Date(roomRef.startTime), status: "ACTIVE" },
                });
              } catch (err) {
                console.error(`[ws] Failed to persist startedAt for battle ${battleId}:`, err);
              }

              if (roomRef.player1?.readyState === WebSocket.OPEN) {
                roomRef.player1.send(
                  JSON.stringify({
                    type: "battle:start",
                    battleId,
                    startTime: roomRef.startTime,
                    duration: roomRef.p1Duration,
                  })
                );
              }
              if (roomRef.player2?.readyState === WebSocket.OPEN) {
                roomRef.player2.send(
                  JSON.stringify({
                    type: "battle:start",
                    battleId,
                    startTime: roomRef.startTime,
                    duration: roomRef.p2Duration,
                  })
                );
              }

              if (!roomRef.timer) rescheduleTimer(roomRef, battleId, battleRooms);
            }, 3000);
          }
        } else {
          // Still waiting for opponent
          ws.send(JSON.stringify({ type: "battle:waiting", battleId }));
        }
      }
      if (message.type === "battle:submit") {
        const { battleId, userId, code, language } = message;
        if (!battleId || !userId || !code || !language) return;

        const room = battleRooms.get(battleId);
        if (!room) return;

        const isPlayer1 = isRoomPlayer1(room, userId);
        const opponent = isPlayer1 ? room.player2 : room.player1;

        // Check if this player's personal clock has expired
        const elapsed = Date.now() - room.startTime;
        const playerDuration = isPlayer1 ? room.p1Duration : room.p2Duration;
        if (room.startTime > 0 && elapsed > playerDuration) {
          ws.send(
            JSON.stringify({
              type: "battle:verdict",
              verdict: "TLE",
              message: "Your time has expired.",
            }),
          );
          return;
        }

        const battle = await prisma.battle.findUnique({
          where: { id: battleId },
          select: {
            questionId: true,
            player1Id: true,
            player2Id: true,
            status: true,
          },
        });
        if (!battle || battle.status !== "ACTIVE") return;
        if (userId !== battle.player1Id && userId !== battle.player2Id) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Not a participant in this battle",
            }),
          );
          return;
        }
        const coolDownTimep1 = room.p1LastSubmitTime + 15 * 1000;
        const coolDownTimep2 = room.p2LastSubmitTime + 15 * 1000;
        if (
          isPlayer1 ? coolDownTimep1 > Date.now() : coolDownTimep2 > Date.now()
        ) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Submission is too soon after the last submission",
            }),
          );
          return;
        }
        const testCases = await prisma.testCase.findMany({
          where: { questionId: battle.questionId },
          orderBy: { order: "asc" },
        });

        const result = await judgeSubmission({ language, code, testCases });
        try {
          const submission = await prisma.submission.create({
            data: {
              userId,
              questionId: battle.questionId,
              code,
              language,
              status: SubmissionStatus.COMPLETED,
              verdict: result.verdict,
              result: result.message,
            },
          });
          console.log(
            `[ws] Created battle submission record ${submission.id} for user ${userId}`,
          );
          room[isPlayer1 ? "p1LastSubmitTime" : "p2LastSubmitTime"] =
            Date.now();
        } catch (err) {
          console.error(`[ws] Failed to create submission record:`, err);
        }

        if (result.verdict === Verdict.AC) {
          const timeTaken = Date.now() - room.startTime;
          if (room.timer) clearTimeout(room.timer);
          room.timer = null;

          const loserId = isPlayer1 ? battle.player2Id : battle.player1Id;

          const checkStatus = await prisma.battle.findUnique({
            where: { id: battleId },
            select: { status: true },
          });
          if (checkStatus?.status !== "ACTIVE") {
            ws.send(
              JSON.stringify({
                type: "battle:result",
                battleId,
                won: false,
                message:
                  "Battle already ended before your submission was judged.",
              }),
            );
            return;
          }

          await prisma.battle.update({
            where: { id: battleId },
            data: {
              status: "COMPLETED",
              winnerId: userId,
              endedAt: new Date(),
              [isPlayer1 ? "player1Time" : "player2Time"]: timeTaken,
            },
          });

          // Update streak for the winner
          try {
            await updateStreak(userId);
          } catch (err) {
            console.error(
              `[ws] Failed to update streak for user ${userId}:`,
              err,
            );
          }

          // Calculate and update Elo
          const [winner, loser] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.user.findUnique({ where: { id: loserId } }),
          ]);

          if (winner && loser) {
            const { winnerNew, loserNew } = calculateNewRating(
              winner.rating,
              loser.rating,
              winner.battlesPlayed,
              loser.battlesPlayed,
            );

            await Promise.all([
              prisma.user.update({
                where: { id: winner.id },
                data: {
                  rating: winnerNew,
                  battlesPlayed: { increment: 1 },
                  battlesWon: { increment: 1 },
                },
              }),
              prisma.user.update({
                where: { id: loser.id },
                data: { rating: loserNew, battlesPlayed: { increment: 1 } },
              }),
            ]);

            // Notify winner
            ws.send(
              JSON.stringify({
                type: "battle:result",
                battleId,
                won: true,
                timeTaken,
                eloChange: winnerNew - winner.rating,
                newRating: winnerNew,
              }),
            );

            // Notify loser
            if (opponent?.readyState === WebSocket.OPEN) {
              opponent.send(
                JSON.stringify({
                  type: "battle:result",
                  battleId,
                  won: false,
                  eloChange: loserNew - loser.rating,
                  newRating: loserNew,
                }),
              );
            }
          }

          battleRooms.delete(battleId);
        } else {
          // Non-AC verdict — notify submitter and opponent
          ws.send(
            JSON.stringify({
              type: "battle:verdict",
              verdict: result.verdict,
              message: result.message,
            }),
          );

          if (opponent?.readyState === WebSocket.OPEN) {
            opponent.send(
              JSON.stringify({
                type: "battle:opponent_submitted",
                verdict: result.verdict,
              }),
            );
          }
        }
      }
      if (message.type === "battle:leave") {
        const { battleId, userId } = message;
        if (!battleId || !userId) return;

        const room = battleRooms.get(battleId);
        if (!room) return;

        if (room.timer) clearTimeout(room.timer);
        room.timer = null;

        const isPlayer1 = isRoomPlayer1(room, userId);
        const opponent = isPlayer1 ? room.player2 : room.player1;

        const battle = await prisma.battle.findUnique({
          where: { id: battleId },
          select: { player1Id: true, player2Id: true, status: true },
        });
        if (!battle) return;
        if (userId !== battle.player1Id && userId !== battle.player2Id) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Not a participant in this battle",
            }),
          );
          return;
        }
        // If battle hasn't started yet (no opponent), just cancel
        if (room.startTime === 0) {
          await prisma.battle.update({
            where: { id: battleId },
            data: { status: "ABANDONED", endedAt: new Date() },
          });

          // Tell the forfeiting player they can leave
          ws.send(
            JSON.stringify({
              type: "battle:result",
              battleId,
              won: false,
              eloChange: 0,
              newRating: 0,
              reason: "cancelled",
            }),
          );

          battleRooms.delete(battleId);
          return;
        }

        const winnerId = isPlayer1 ? battle.player2Id : battle.player1Id;

        await prisma.battle.update({
          where: { id: battleId },
          data: {
            status: "ABANDONED",
            winnerId,
            endedAt: new Date(),
          },
        });

        // Elo update for forfeit
        const [winner, loser] = await Promise.all([
          prisma.user.findUnique({ where: { id: winnerId } }),
          prisma.user.findUnique({ where: { id: userId } }),
        ]);

        if (winner && loser) {
          const { winnerNew, loserNew } = calculateNewRating(
            winner.rating,
            loser.rating,
            winner.battlesPlayed,
            loser.battlesPlayed,
          );

          await Promise.all([
            prisma.user.update({
              where: { id: winner.id },
              data: {
                rating: winnerNew,
                battlesPlayed: { increment: 1 },
                battlesWon: { increment: 1 },
              },
            }),
            prisma.user.update({
              where: { id: loser.id },
              data: { rating: loserNew, battlesPlayed: { increment: 1 } },
            }),
          ]);
          // Notify the forfeiting player (loser) so their UI transitions
          ws.send(
            JSON.stringify({
              type: "battle:result",
              battleId,
              won: false,
              eloChange: loserNew - loser.rating,
              newRating: loserNew,
              reason: "forfeited",
            }),
          );

          // Notify the opponent (winner)
          if (opponent?.readyState === WebSocket.OPEN) {
            opponent.send(
              JSON.stringify({
                type: "battle:result",
                battleId,
                won: true,
                eloChange: winnerNew - winner.rating,
                newRating: winnerNew,
                reason: "opponent_left",
              }),
            );
          }
        }

        battleRooms.delete(battleId);
      }
      if (message.type === "battle:hint") {
        const { battleId, userId } = message;
        if (!battleId || !userId) return;

        const room = battleRooms.get(battleId);
        if (!room) return;

        const isPlayer1 = isRoomPlayer1(room, userId);
        const opponent = isPlayer1 ? room.player2 : room.player1;
        const hintField = isPlayer1 ? "player1Hints" : "player2Hints";

        const battle = await prisma.battle.findUnique({
          where: { id: battleId },
          select: {
            questionId: true,
            player1Hints: true,
            player2Hints: true,
            status: true,
          },
        });
        if (!battle) return;
        if (battle.status !== "ACTIVE") {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Battle not active",
            }),
          );
          return;
        }
        const currentHints = isPlayer1
          ? battle.player1Hints
          : battle.player2Hints;
        if (currentHints >= 3) {
          ws.send(
            JSON.stringify({
              type: "battle:hint_denied",
              reason: "No hints remaining",
            }),
          );
          return;
        }

        const { getHintsForQuestion, getHintPenalty } =
          await import("../battle/hints");
        const hints = await getHintsForQuestion(battle.questionId);
        const penalty = getHintPenalty(currentHints);

        // Reduce duration ONLY for the player who used the hint
        if (isPlayer1) {
          room.p1Duration -= penalty;
        } else {
          room.p2Duration -= penalty;
        }

        // reschedule the timer
        if (room.startTime > 0) {
          rescheduleTimer(room, battleId, battleRooms);
        }

        await prisma.battle.update({
          where: { id: battleId },
          data: { [hintField]: { increment: 1 } },
        });

        const requesterDuration = isPlayer1 ? room.p1Duration : room.p2Duration;
        ws.send(
          JSON.stringify({
            type: "battle:hint",
            hint: hints[currentHints],
            hintNumber: currentHints + 1,
            penaltyMs: penalty,
            remainingHints: 2 - currentHints,
            newDuration: requesterDuration,
          }),
        );
        if (opponent?.readyState === WebSocket.OPEN) {
          opponent.send(
            JSON.stringify({
              type: "battle:opponent_hint",
              hintNumber: currentHints + 1,
            }),
          );
        }
      }

      if (message.type === "subscribe") {
        clients.set(message.submissionId, ws);
        console.log(`Subscribed to submission ${message.submissionId}`);
        const subscriber = createClient({
          url: process.env.REDIS_URL || "redis://localhost:6379",
        });
        await subscriber.connect();
        await subscriber.subscribe(`verdict:${message.submissionId}`, (msg) => {
          ws.send(msg);
          subscriber.unsubscribe();
          subscriber.quit();
        });
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");

      const meta = wsMetadata.get(ws);
      wsMetadata.delete(ws);
      if (!meta) return;

      const { battleId, userId } = meta;
      const room = battleRooms.get(battleId);
      if (!room) return;

      const isPlayer1 = room.battlePlayer1Id === userId;

      if (isPlayer1) {
        room.player1 = null;
      } else {
        room.player2 = null;
      }

      const opponent = isPlayer1 ? room.player2 : room.player1;
      if (opponent?.readyState === WebSocket.OPEN) {
        opponent.send(
          JSON.stringify({
            type: "battle:opponent_disconnected",
            battleId,
            gracePeriodMs: DISCONNECT_GRACE_MS,
          }),
        );
      }

      const disconnectTimer = setTimeout(() => {
        handleDisconnectForfeit(battleId, userId);
      }, DISCONNECT_GRACE_MS);

      if (isPlayer1) {
        room.p1DisconnectTimer = disconnectTimer;
      } else {
        room.p2DisconnectTimer = disconnectTimer;
      }
    });
  });
}
