import type { Difficulty, GridRenderableState } from "@/lib/simulation/gridWorld";

export type SimulationCommand =
  | {
      type: "configure";
      payload: Partial<{
        difficulty: Difficulty;
        agentCount: number;
        rewardCount: number;
        maxSteps: number;
        size: number;
        seed: string;
      }>;
    }
  | {
      type: "loadPolicy";
      payload: { url?: string; buffer?: ArrayBuffer };
    }
  | { type: "start"; payload: { speed: number } }
  | { type: "pause" }
  | { type: "resume"; payload?: { speed?: number } }
  | { type: "step"; payload: { steps: number } }
  | { type: "reset" }
  | { type: "dispose" };

export type SimulationEvent =
  | { type: "policy"; payload: { ready: boolean; message?: string } }
  | {
      type: "state";
      payload: { frame: GridRenderableState; policyReady: boolean };
      timestamp: number;
    }
  | { type: "error"; error: string };
