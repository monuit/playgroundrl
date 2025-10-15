/**
 * Example: Setting up and running a multi-agent game session
 * 
 * This demonstrates the complete workflow:
 * 1. Initialize stores
 * 2. Create agents
 * 3. Load models
 * 4. Run game loop
 * 5. Collect results
 */

import { useAgentsStore, useGameStore } from './store/agents';
import { initializeSession } from './runModel';
import { stepGame, resetGame } from './engine';

/**
 * EXAMPLE 1: Initialize a single-agent game session
 */
export async function initializeSingleAgentGame() {
  console.log('=== Initializing Single Agent Game ===\n');

  // 1. Get stores
  const gameStore = useGameStore.getState();
  const agentStore = useAgentsStore.getState();

  // 2. Set level
  gameStore.setLevelById('level1');

  // 3. Create agent (auto-initialized at start position)
  agentStore.addAgent('agent_1', 1, 1);
  const agent = agentStore.getAgent('agent_1');
  console.log('Agent created:', agent);

  // 4. Load ONNX model
  try {
    await initializeSession();
    console.log('✓ ONNX model loaded\n');
  } catch (error) {
    console.error('Failed to load model:', error);
    return;
  }

  // 5. Start game loop
  gameStore.setPaused(false);
  gameStore.setTickDuration(100);
}

/**
 * EXAMPLE 2: Multi-agent setup with statistics collection
 */
export async function initializeMultiAgentGame(numAgents: number = 4) {
  console.log(`=== Initializing ${numAgents}-Agent Game ===\n`);

  const gameStore = useGameStore.getState();
  const agentStore = useAgentsStore.getState();

  // Setup level
  gameStore.setLevelById('level2');
  const level = gameStore.level;

  // Create multiple agents from different start positions
  for (let i = 0; i < numAgents; i++) {
    const startPos = level.startPositions[i % level.startPositions.length];
    agentStore.addAgent(`agent_${i}`, startPos[0], startPos[1]);
  }

  console.log(`✓ ${numAgents} agents created\n`);

  // Load model
  try {
    await initializeSession();
    console.log('✓ Model ready\n');
  } catch (error) {
    console.error('Failed to load model:', error);
  }
}

/**
 * EXAMPLE 3: Run a full episode and collect statistics
 */
export async function runEpisode(maxSteps: number = 200) {
  const stats = {
    totalSteps: 0,
    totalReward: 0,
    agentsCompleted: 0,
    startTime: Date.now(),
  };

  console.log(`Starting episode (max ${maxSteps} steps)...\n`);

  for (let step = 0; step < maxSteps; step++) {
    // Run one game step
    const results = await stepGame();

    if (results.length === 0) break; // All agents done

    // Collect statistics
    results.forEach((result) => {
      stats.totalSteps++;
      stats.totalReward += result.reward;
      if (result.done) {
        stats.agentsCompleted++;
      }
    });

    // Log progress
    if (step % 20 === 0) {
      console.log(
        `Step ${step}: ${results.length} agents active, ` +
        `avg reward: ${(stats.totalReward / stats.totalSteps).toFixed(3)}`
      );
    }
  }

  const elapsed = Date.now() - stats.startTime;

  console.log('\n=== Episode Summary ===');
  console.log(`Duration: ${elapsed}ms`);
  console.log(`Total steps executed: ${stats.totalSteps}`);
  console.log(`Total reward: ${stats.totalReward.toFixed(2)}`);
  console.log(`Agents completed: ${stats.agentsCompleted}`);
  console.log(
    `Avg reward per step: ${(stats.totalReward / stats.totalSteps).toFixed(3)}`
  );

  return stats;
}

/**
 * EXAMPLE 4: Monitor agent state during game
 */
export function monitorAgent(agentId: string, printInterval: number = 10) {
  const agentStore = useAgentsStore.getState();

  return setInterval(() => {
    const agent = agentStore.getAgent(agentId);
    if (!agent) {
      console.log(`Agent ${agentId} not found`);
      return;
    }

    console.log(`[${agentId}]`, {
      pos: `(${agent.x}, ${agent.y})`,
      reward: agent.reward.toFixed(2),
      episodeReturn: agent.episodeReturn.toFixed(2),
      steps: agent.steps,
      done: agent.done ? '✓ DONE' : 'running',
    });
  }, printInterval);
}

/**
 * EXAMPLE 5: Test inference directly
 */
export async function testInference() {
  const { initializeSession, runInference } = await import('./runModel');

  await initializeSession();

  // Create observation
  const observation = {
    agentX: 5,
    agentY: 5,
    goalX: 20,
    goalY: 20,
    distToGoal: Math.sqrt((20 - 5) ** 2 + (20 - 5) ** 2),
  };

  console.log('Test observation:', observation);

  const result = await runInference(observation);
  console.log('Action:', result.action);
  console.log('Logits:', result.logits);
}

/**
 * EXAMPLE 6: Reset and replay
 */
export function resetAndReplay() {
  const gameStore = useGameStore.getState();

  console.log('Resetting game...');

  // Reset agents to start positions
  resetGame();

  // Reset tick counter
  gameStore.setLevel(gameStore.level);

  console.log('✓ Game reset. Ready to play again.');
}

/**
 * USAGE IN REACT COMPONENT
 * 
 * Example component that uses the above functions:
 * 
 * ```tsx
 * export function GameDemo() {
 *   const [running, setRunning] = useState(false);
 * 
 *   const handleStart = async () => {
 *     setRunning(true);
 *     await initializeSingleAgentGame();
 *   };
 * 
 *   const handleStop = () => {
 *     useGameStore.getState().setPaused(true);
 *     setRunning(false);
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleStart} disabled={running}>
 *         Start Game
 *       </button>
 *       <button onClick={handleStop} disabled={!running}>
 *         Stop Game
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */

export const EXAMPLES_GUIDE = 'See functions above for example usage patterns';
