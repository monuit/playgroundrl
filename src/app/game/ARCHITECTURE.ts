/**
 * Game system architecture documentation and quick reference
 */

/**
 * ARCHITECTURE OVERVIEW
 * 
 * The system consists of 5 main layers:
 * 
 * 1. WORLD STATE (Zustand stores)
 *    - useAgentsStore: Agent positions, rewards, done flags
 *    - useGameStore: Game loop control (pause/resume, tick rate, level)
 *    - useWorldStore: Collision detection, tile queries
 * 
 * 2. RENDERING (React Three Fiber)
 *    - Canvas: Main 3D scene with lights and camera
 *    - LevelOne/LevelTwo: Grid and obstacle meshes (InstancedMesh)
 *    - Player: Bunny agent with spring animation
 *    - Hud: UI controls and status display
 * 
 * 3. GAME ENGINE (engine.ts)
 *    - stepGame(): Main tick function
 *      - Builds observations for active agents
 *      - Runs batch ONNX inference
 *      - Applies actions and updates positions
 *      - Computes rewards and terminal states
 * 
 * 4. INFERENCE (runModel.ts)
 *    - initializeSession(): Load ONNX model once
 *    - runInference(): Single agent prediction
 *    - runBatchInference(): Multiple agents at once
 * 
 * 5. TRAINING (train/*)
 *    - gridworld_env.py: Gymnasium environment
 *    - ppo.py: SB3 PPO training script
 *    - torch2onnx.py: Convert to ONNX format
 * 
 * DATA CONTRACTS (CRITICAL)
 * ========================
 * 
 * Observation vector MUST match between training and inference:
 * 
 *   Level 1: [agent_x, agent_y, goal_x, goal_y, dist_to_goal]
 *   Shape: (5,) as float32
 * 
 * Action space: discrete 4
 *   0 = UP (y-1)
 *   1 = DOWN (y+1)
 *   2 = LEFT (x-1)
 *   3 = RIGHT (x+1)
 * 
 * Reward structure (consistent across train/inference):
 *   +1.0  = reached goal
 *   -1.0  = hit obstacle
 *   -0.01 = step cost (encourage efficiency)
 * 
 * Terminal conditions:
 *   - reached_goal = True
 *   - hit_obstacle = True
 *   - max_steps = 100
 * 
 * COMMON TASKS
 * ============
 * 
 * 1. Add a new agent to the game:
 *    ```ts
 *    const agentStore = useAgentsStore.getState();
 *    agentStore.addAgent("agent_1", 1, 1);  // id, x, y
 *    ```
 * 
 * 2. Render an agent in the level:
 *    ```tsx
 *    <Player agentId="agent_1" />
 *    ```
 * 
 * 3. Update tick speed:
 *    ```ts
 *    const gameStore = useGameStore.getState();
 *    gameStore.setTickDuration(100);  // ms per tick
 *    ```
 * 
 * 4. Change level:
 *    ```ts
 *    gameStore.setLevelById("level2");
 *    ```
 * 
 * 5. Train a new model:
 *    ```bash
 *    cd train
 *    python ppo.py
 *    python torch2onnx.py --batch
 *    ```
 * 
 * 6. Add Level 3:
 *    - Define obstacles in store/world.ts (LEVEL_THREE)
 *    - Create LevelThree.tsx component
 *    - Update game page to render it
 *    - Update train/gridworld_env.py with new env
 * 
 * DEBUGGING
 * =========
 * 
 * Check agent state:
 *   ```ts
 *   const agent = useAgentsStore.getState().getAgent("agent_1");
 *   console.log(agent);
 *   ```
 * 
 * Check collision:
 *   ```ts
 *   const blocked = useWorldStore.getState().isBlocked(10, 10);
 *   ```
 * 
 * Test inference:
 *   ```ts
 *   import { runInference } from "@/app/game/runModel";
 *   const result = await runInference({
 *     agentX: 5, agentY: 5, goalX: 20, goalY: 20, distToGoal: 21.2
 *   });
 *   ```
 * 
 * PERFORMANCE TIPS
 * ================
 * 
 * - InstancedMesh for 600+ tiles is 100x faster than individual meshes
 * - Spring duration 100-180ms keeps animations crisp and in sync
 * - Batch inference (multiple agents in one ONNX call) is faster
 * - Disable shadows if rendering many agents (<20 agents is fine)
 * 
 * FILE STRUCTURE
 * ==============
 * 
 * src/app/game/
 *   ├── page.tsx              Game page with Canvas
 *   ├── types.ts              Type definitions
 *   ├── engine.ts             Game loop logic
 *   ├── runModel.ts           ONNX inference
 *   ├── Player.tsx            Agent bunny mesh
 *   ├── LevelOne.tsx          Static obstacle level
 *   ├── LevelTwo.tsx          Moving obstacle level
 *   ├── Hud.tsx               UI controls
 *   └── store/
 *       ├── agents.ts         Agent state (useAgentsStore)
 *       └── world.ts          World state (useWorldStore, levels)
 * 
 * public/models/
 *   ├── bunny.glb             Agent mesh (optional: placeholder works)
 *   ├── policy_level1.onnx    Level 1 policy
 *   └── policy_level2.onnx    Level 2 policy
 * 
 * train/
 *   ├── gridworld_env.py      Gymnasium environment
 *   ├── ppo.py                Training script
 *   ├── torch2onnx.py         ONNX export
 *   ├── requirements.txt       Python deps
 *   └── README.md             Training guide
 */

export const ARCHITECTURE_GUIDE = `
See inline comments in this file for detailed documentation.
`;
