"use client";
import { useEffect, useRef, useState, useCallback } from "react";

type BattleState = {
  status:
    | "connecting"
    | "waiting"
    | "countdown"
    | "active"
    | "finished"
    | "timeout";
  countdown: number;
  startTime: number;
  duration: number;
  won: boolean | null;
  eloChange: number;
  newRating: number;
  opponentEvents: string[];
  verdict: string | null;
  verdictMessage: string | null;
  hint: string | null;
  hintsUsed: number;
  isSubmitting: boolean;
  opponentDisconnected: boolean;
};

export function useBattleSocket(battleId: string, userId: string) {
  const [state, setState] = useState<BattleState>({
    status: "connecting",
    countdown: 3,
    startTime: 0,
    duration: 0,
    won: null,
    eloChange: 0,
    newRating: 0,
    opponentEvents: [],
    verdict: null,
    verdictMessage: null,
    hint: null,
    hintsUsed: 0,
    isSubmitting: false,
    opponentDisconnected: false,
  });

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!battleId || !userId) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "battle:join", battleId, userId }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "battle:waiting":
          setState((prev) => ({ ...prev, status: "waiting" }));
          break;

        case "battle:countdown":
          setState((prev) => ({ ...prev, status: "countdown" }));
          let count = 3;
          const interval = setInterval(() => {
            count--;
            setState((prev) => ({ ...prev, countdown: count }));
            if (count <= 0) clearInterval(interval);
          }, 1000);
          break;

        case "battle:start":
          setState((prev) => ({
            ...prev,
            status: "active",
            startTime: msg.startTime,
            duration: msg.duration,
            opponentDisconnected: false,
          }));
          break;

        case "battle:verdict":
          setState((prev) => ({
            ...prev,
            verdict: msg.verdict,
            verdictMessage: msg.message,
            isSubmitting: false,
            opponentDisconnected: false,
          }));
          break;

        case "battle:opponent_submitted":
          setState((prev) => ({
            ...prev,
            opponentEvents: [
              ...prev.opponentEvents,
              `Opponent: ${msg.verdict}`,
            ],
            opponentDisconnected: false,
          }));
          break;

        case "battle:result":
          setState((prev) => ({
            ...prev,
            status: "finished",
            won: msg.won,
            eloChange: msg.eloChange,
            newRating: msg.newRating,
            isSubmitting: false,
            verdictMessage: msg.message || prev.verdictMessage
          }));
          break;

        case "battle:timeout":
          // Timeout = draw, neither player wins
          setState((prev) => ({
            ...prev,
            status: "finished",
            won: false,
            eloChange: 0,
            newRating: 0,
            isSubmitting: false,
            verdictMessage: "Time ran out! The battle ended in a draw.",
          }));
          break;

        case "battle:hint":
          setState((prev) => ({
            ...prev,
            hint: msg.hint,
            hintsUsed: msg.hintNumber,
            duration:
              msg.newDuration !== undefined ? msg.newDuration : prev.duration,
          }));
          break;

        case "battle:opponent_hint":
          setState((prev) => ({
            ...prev,
            opponentEvents: [
              ...prev.opponentEvents,
              `Opponent used hint #${msg.hintNumber}`,
            ],
          }));
          break;
        
        case "battle:opponent_disconnected":
          setState((prev) => ({
            ...prev,
            opponentDisconnected: true,
          }));
          break;

        case "battle:hint_denied":
          break;

        case "error":
          console.error("[battle ws] Server error:", msg.message);
          break;
      }
    };

    return () => ws.close();
  }, [battleId, userId]);

  //actions
  const sendSubmit = useCallback(
    (code: string, language: string) => {
      setState((prev) => ({
        ...prev,
        isSubmitting: true,
        verdict: null,
        verdictMessage: null,
      }));
      wsRef.current?.send(
        JSON.stringify({
          type: "battle:submit",
          battleId,
          userId,
          code,
          language,
        }),
      );
    },
    [battleId, userId],
  );

  const sendHint = useCallback(() => {
    wsRef.current?.send(
      JSON.stringify({
        type: "battle:hint",
        battleId,
        userId,
      }),
    );
  }, [battleId, userId]);

  const sendLeave = useCallback(() => {
    wsRef.current?.send(
      JSON.stringify({
        type: "battle:leave",
        battleId,
        userId,
      }),
    );
  }, [battleId, userId]);

  return { ...state, sendSubmit, sendHint, sendLeave };
}
