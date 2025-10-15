"""
Warehouse Bots Environment
Multi-agent discrete control task using Gymnasium
"""

import gymnasium as gym
import numpy as np
from gymnasium import spaces


class WarehouseBotsEnv(gym.Env):
    """
    Three warehouse robots picking and delivering packages.
    State per bot: [x, y, goal_x, goal_y, distance, battery, carrying, job_queue,
                    occupancy_grid (5x5), neighbor_velocities (8)] = 34D
    Action per bot: Discrete(5) - [forward, turn_left, turn_right, dock, charge]
    Reward: -0.01 per step, +0.5 per delivery, +0.1 per docking, -0.5 for collision
    """

    metadata = {"render_modes": ["rgb_array"], "render_fps": 30}

    def __init__(self, level_config=None):
        """Initialize the multi-agent warehouse environment."""
        self.grid_size = 25
        self.num_agents = 3
        self.occupancy_grid_size = 5

        if level_config is None:
            level_config = {
                "gridSize": 25,
                "staticObstacles": [
                    {"x": 10, "y": 10},
                    {"x": 10, "y": 11},
                    {"x": 12, "y": 10},
                ],
                "goalPositions": [
                    {"x": 24, "y": 24},
                    {"x": 1, "y": 24},
                ],
                "startPositions": [
                    {"x": 12, "y": 12},
                    {"x": 5, "y": 5},
                    {"x": 20, "y": 20},
                ],
            }

        self.level_config = level_config
        self.static_obstacles = set()
        for obs in level_config.get("staticObstacles", []):
            self.static_obstacles.add((obs["x"], obs["y"]))

        self.goal_positions = [
            (g["x"], g["y"]) for g in level_config.get("goalPositions", [])
        ]
        self.start_positions = [
            (s["x"], s["y"]) for s in level_config.get("startPositions", [])
        ]

        # Observation: [x, y, goal_x, goal_y, distance, battery, carrying, job_queue,
        #              5x5 occupancy (25), 8 neighbor velocities] = 34D
        self.observation_space = spaces.Box(
            low=0.0, high=float(self.grid_size), shape=(34,), dtype=np.float32
        )

        # Action: discrete [forward, turn_left, turn_right, dock, charge]
        self.action_space = spaces.Discrete(5)

        self.agent_pos = [np.array(pos, dtype=np.float32) for pos in self.start_positions]
        self.agent_battery = [1.0] * self.num_agents
        self.agent_carrying = [False] * self.num_agents
        self.agent_jobs = [0] * self.num_agents
        self.step_count = 0
        self.max_steps = 500

    def _get_occupancy_grid(self, agent_idx):
        """Get 5x5 occupancy grid around agent."""
        pos = self.agent_pos[agent_idx]
        grid = np.zeros((self.occupancy_grid_size, self.occupancy_grid_size), dtype=np.float32)

        center = self.occupancy_grid_size // 2
        for i in range(self.occupancy_grid_size):
            for j in range(self.occupancy_grid_size):
                check_x = int(pos[0]) + i - center
                check_y = int(pos[1]) + j - center
                if (check_x, check_y) in self.static_obstacles:
                    grid[i, j] = 1.0

        return grid.flatten()

    def _get_observation(self, agent_idx):
        """Get observation for agent."""
        pos = self.agent_pos[agent_idx]
        goal = self.goal_positions[agent_idx % len(self.goal_positions)]
        dist = np.linalg.norm(np.array(goal) - pos)

        # Occupancy grid
        occupancy = self._get_occupancy_grid(agent_idx)

        # Neighbor velocities (simplified: just relative positions)
        neighbors = np.zeros(8, dtype=np.float32)
        for i, other_idx in enumerate(range(self.num_agents)):
            if other_idx != agent_idx and i < 4:
                offset = self.agent_pos[other_idx] - pos
                neighbors[2 * i] = offset[0]
                neighbors[2 * i + 1] = offset[1]

        obs = np.concatenate(
            [
                pos,
                np.array(goal, dtype=np.float32),
                np.array([dist], dtype=np.float32),
                np.array([self.agent_battery[agent_idx]], dtype=np.float32),
                np.array([float(self.agent_carrying[agent_idx])], dtype=np.float32),
                np.array([float(self.agent_jobs[agent_idx])], dtype=np.float32),
                occupancy,
                neighbors,
            ]
        ).astype(np.float32)

        return obs

    def step(self, actions):
        """Execute one step for all agents."""
        if isinstance(actions, (int, float, np.integer)):
            actions = [actions]
        if not isinstance(actions, np.ndarray):
            actions = np.array(actions)

        self.step_count += 1
        rewards = np.zeros(self.num_agents, dtype=np.float32)

        for i in range(self.num_agents):
            action = actions[i] if isinstance(actions, np.ndarray) and len(actions) > i else actions[0]
            self.agent_battery[i] = max(0.0, self.agent_battery[i] - 0.01)

            # Apply action
            if action == 0:  # forward
                self.agent_pos[i][0] = min(self.grid_size - 1, self.agent_pos[i][0] + 0.5)
            elif action == 1:  # turn left
                self.agent_pos[i][1] = min(self.grid_size - 1, self.agent_pos[i][1] + 0.3)
            elif action == 2:  # turn right
                self.agent_pos[i][1] = max(0, self.agent_pos[i][1] - 0.3)
            elif action == 3:  # dock
                rewards[i] += 0.1
            elif action == 4:  # charge
                self.agent_battery[i] = min(1.0, self.agent_battery[i] + 0.05)

            rewards[i] -= 0.01

        obs = np.array([self._get_observation(i) for i in range(self.num_agents)])
        terminateds = np.array([battery <= 0 for battery in self.agent_battery])
        truncateds = np.array([self.step_count >= self.max_steps] * self.num_agents)

        return obs, rewards, terminateds, truncateds, {}

    def reset(self, seed=None, options=None):
        """Reset environment."""
        super().reset(seed=seed)
        self.agent_pos = [np.array(pos, dtype=np.float32) for pos in self.start_positions]
        self.agent_battery = [1.0] * self.num_agents
        self.agent_carrying = [False] * self.num_agents
        self.agent_jobs = [0] * self.num_agents
        self.step_count = 0
        obs = np.array([self._get_observation(i) for i in range(self.num_agents)])
        return obs, {}

    def render(self):
        """Render not implemented."""
        pass

    def close(self):
        """Close environment."""
        pass
