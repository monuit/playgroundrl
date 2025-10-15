/**
 * Main game engine: handles stepping, observations, and reward computation
 */
import { Agent, Action, Observation } from './types';
import { useAgentsStore } from './store/agents';
import { useWorldStore } from './store/world';
import { runBatchInference } from './runModel';

export { initializeSession } from './runModel';

interface StepResult {
  agentId: string;
  action: Action;
  reward: number;
  done: boolean;
  newX: number;
  newY: number;
}

/**
 * Build observation for a single agent
 */
export function buildAgentObservation(agent: Agent, goalX: number, goalY: number): Observation {
  const dx = goalX - agent.x;
  const dy = goalY - agent.y;
  const distToGoal = Math.sqrt(dx * dx + dy * dy);

  return {
    agentX: agent.x,
    agentY: agent.y,
    goalX,
    goalY,
    distToGoal,
    // TODO: Add vision rays for Level 2
  };
}

/**
 * Compute reward for a single step
 */
export function computeReward(
  prevPos: [number, number],
  newPos: [number, number],
  goalPos: [number, number],
  hitObstacle: boolean,
  reachedGoal: boolean
): number {
  if (hitObstacle) {
    return -1.0; // Collision penalty
  }

  if (reachedGoal) {
    return 1.0; // Goal reward
  }

  // Small step penalty to encourage efficient paths
  return -0.01;
}

/**
 * Apply action to an agent's position
 * Returns new position and whether it's blocked
 */
export function applyAction(
  agent: Agent,
  action: Action,
  worldStore: ReturnType<typeof useWorldStore.getState>
): { newX: number; newY: number; blocked: boolean } {
  let newX = agent.x;
  let newY = agent.y;

  // Update position based on action
  switch (action) {
    case Action.UP:
      newY = Math.max(0, agent.y - 1);
      break;
    case Action.DOWN:
      newY = Math.min(24, agent.y + 1);
      break;
    case Action.LEFT:
      newX = Math.max(0, agent.x - 1);
      break;
    case Action.RIGHT:
      newX = Math.min(24, agent.x + 1);
      break;
  }

  // Check collision
  const blocked = worldStore.isBlocked(newX, newY);

  return { newX, newY, blocked };
}

/**
 * Execute a single game step for all active agents
 */
export async function stepGame(): Promise<StepResult[]> {
  const agentsStore = useAgentsStore.getState();
  const worldStore = useWorldStore.getState();
  const level = worldStore.level;

  if (!level) {
    console.warn('No level loaded, skipping step');
    return [];
  }

  const activeAgents = agentsStore.agents.filter((agent) => !agent.done);

  if (activeAgents.length === 0) {
    return [];
  }

  // Build observations for all active agents
  const [goalX, goalY] = level.goalPosition;
  const observations = activeAgents.map((agent) =>
    buildAgentObservation(agent, goalX, goalY)
  );

  // Run batch inference
  let inferenceResults;
  try {
    inferenceResults = await runBatchInference(observations);
  } catch (error) {
    console.error('Inference failed:', error);
    // Fallback to random actions
    inferenceResults = observations.map(() => ({
      action: Math.floor(Math.random() * 4) as Action,
      logits: [0, 0, 0, 0],
    }));
  }

  // Process results
  const stepResults: StepResult[] = [];

  activeAgents.forEach((agent, idx) => {
    const action = inferenceResults[idx].action;
    const { newX, newY, blocked } = applyAction(agent, action, worldStore);

    const reachedGoal = newX === goalX && newY === goalY;
    const hitObstacle = blocked;
    const done = reachedGoal || hitObstacle;

    const reward = computeReward([agent.x, agent.y], [newX, newY], level.goalPosition, hitObstacle, reachedGoal);

    stepResults.push({
      agentId: agent.id,
      action,
      reward,
      done,
      newX,
      newY,
    });

    // Update agent in store
    agentsStore.updateAgent(agent.id, {
      x: newX,
      y: newY,
      done,
      reward,
      episodeReturn: agent.episodeReturn + reward,
      steps: agent.steps + 1,
    });
  });

  return stepResults;
}

/**
 * Reset game state
 */
export function resetGame(): void {
  const agentsStore = useAgentsStore.getState();
  const worldStore = useWorldStore.getState();
  const level = worldStore.level;

  if (level) {
    agentsStore.resetAgents(level.startPositions);
  }
}
