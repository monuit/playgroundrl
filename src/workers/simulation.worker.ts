import { GridWorldEngine, type GridWorldConfig } from "@/lib/simulation/gridWorld";
import { PolicyRunner } from "@/lib/simulation/policyRunner";
import type { SimulationCommand, SimulationEvent } from "./simulation.types";

const DEFAULT_CONFIG: GridWorldConfig = {
  size: 25,
  agentCount: 8,
  rewardCount: 12,
  maxSteps: 600,
  difficulty: "meadow",
};

const BASE_RATE = 12;

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

let currentConfig = { ...DEFAULT_CONFIG };
let engine = new GridWorldEngine(currentConfig);
const runner = new PolicyRunner();
let status: "idle" | "running" | "paused" = "idle";
let speed = 1;
let loopHandle: ReturnType<typeof setTimeout> | null = null;

const post = (event: SimulationEvent) => {
  ctx.postMessage(event);
};

const cloneFrame = (frame: ReturnType<typeof engine.getRenderableState>) => ({
  ...frame,
  tiles: frame.tiles.slice(0),
  rewards: frame.rewards.map((reward) => ({ ...reward })),
  agents: frame.agents.map((agent) => ({
    ...agent,
    trail: agent.trail.map((point) => ({ ...point })),
  })),
});

const broadcastState = (frame = engine.getRenderableState()) => {
  post({
    type: "state",
    payload: { frame: cloneFrame(frame), policyReady: runner.isReady() },
    timestamp: Date.now(),
  });
};

const cancelLoop = () => {
  if (loopHandle !== null) {
    clearTimeout(loopHandle);
    loopHandle = null;
  }
};

const runTick = async () => {
  const observations = engine.buildObservations();
  let actions: number[];
  if (runner.isReady()) {
    try {
      actions = await runner.actBatch(observations);
    } catch (error) {
      post({ type: "error", error: error instanceof Error ? error.message : String(error) });
      actions = engine.heuristicActions();
    }
  } else {
    actions = engine.heuristicActions();
  }
  const frame = engine.step(actions);
  broadcastState(frame);
};

const scheduleLoop = async (immediate = false) => {
  cancelLoop();
  if (status !== "running") {
    return;
  }
  if (immediate) {
    await runTick();
  }
  const interval = Math.max(16, 1000 / (BASE_RATE * Math.max(0.25, speed)));
  loopHandle = setTimeout(async () => {
    await runTick();
    await scheduleLoop(false);
  }, interval);
};

const handleCommand = async (command: SimulationCommand) => {
  switch (command.type) {
    case "configure":
      currentConfig = {
        ...currentConfig,
        ...command.payload,
      };
      engine = new GridWorldEngine(currentConfig);
      if (status === "running") {
        await scheduleLoop(true);
      } else {
        broadcastState();
      }
      break;
    case "loadPolicy":
      try {
        if (command.payload.buffer) {
          await runner.loadFromArrayBuffer(command.payload.buffer);
        } else if (command.payload.url) {
          await runner.loadFromUrl(command.payload.url);
        }
        post({
          type: "policy",
          payload: { ready: runner.isReady(), message: runner.isReady() ? "Policy ready" : "Policy cleared" },
        });
      } catch (error) {
        runner.clear();
        post({
          type: "policy",
          payload: {
            ready: false,
            message: error instanceof Error ? error.message : String(error),
          },
        });
        post({ type: "error", error: error instanceof Error ? error.message : String(error) });
      }
      break;
    case "start":
      speed = Math.max(0.25, command.payload.speed);
      status = "running";
      await scheduleLoop(true);
      break;
    case "resume":
      if (command.payload?.speed) {
        speed = Math.max(0.25, command.payload.speed);
      }
      status = "running";
      await scheduleLoop(false);
      break;
    case "pause":
      status = "paused";
      cancelLoop();
      break;
    case "step": {
      const previous = status;
      status = "paused";
      cancelLoop();
      const steps = Math.max(1, Math.floor(command.payload.steps));
      for (let i = 0; i < steps; i += 1) {
        await runTick();
      }
      status = previous;
      if (previous === "running") {
        await scheduleLoop(false);
      }
      break;
    }
    case "reset":
      engine = new GridWorldEngine(currentConfig);
      broadcastState();
      break;
    case "dispose":
      status = "idle";
      cancelLoop();
      runner.clear();
      close();
      break;
    default:
      break;
  }
};

ctx.onmessage = (event: MessageEvent<SimulationCommand>) => {
  void handleCommand(event.data);
};

broadcastState();
