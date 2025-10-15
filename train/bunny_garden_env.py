"""
Bunny Garden Environment
Single-agent discrete navigation task using Gymnasium
"""

import gymnasium as gym
import numpy as np
from gymnasium import spaces


class BunnyGardenEnv(gym.Env):
    """
    Single bunny navigating a garden maze.
    State: [agent_x, agent_y, goal_x, goal_y, distance_to_goal, energy]
    Action: Discrete(4) - [up, down, left, right]
    Reward: -0.01 per step, +1.0 for reaching goal, -1.0 for hitting obstacle
    """

    metadata = {"render_modes": ["rgb_array"], "render_fps": 30}

    def __init__(self, level_config=None):
        """
        Initialize the environment.
        
        Args:
            level_config: Dict with keys:
                - gridSize: int (default 25)
                - staticObstacles: List of {x, y} positions
                - goalPositions: List of {x, y} goal locations
                - startPositions: List of {x, y} start positions
        """
        self.grid_size = 25
        self.tile_size = 1.0

        # Default level config if not provided
        if level_config is None:
            level_config = {
                "gridSize": 25,
                "staticObstacles": [
                    {"x": 5, "y": 5},
                    {"x": 5, "y": 6},
                    {"x": 5, "y": 7},
                    {"x": 10, "y": 10},
                    {"x": 10, "y": 11},
                    {"x": 15, "y": 15},
                ],
                "goalPositions": [{"x": 23, "y": 23}],
                "startPositions": [{"x": 1, "y": 1}],
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

        self.current_goal_idx = 0
        self.current_goal = self.goal_positions[self.current_goal_idx]

        # Observation space: [agent_x, agent_y, goal_x, goal_y, distance_to_goal, energy]
        self.observation_space = spaces.Box(
            low=0.0, high=float(self.grid_size), shape=(6,), dtype=np.float32
        )

        # Action space: 0=up, 1=down, 2=left, 3=right
        self.action_space = spaces.Discrete(4)

        self.agent_pos = np.array(self.start_positions[0], dtype=np.float32)
        self.energy = 1.0
        self.step_count = 0
        self.max_steps = 500

    def _get_observation(self):
        """Return current observation as array."""
        dist_to_goal = np.linalg.norm(
            np.array(self.current_goal) - self.agent_pos
        )
        obs = np.array(
            [
                self.agent_pos[0],
                self.agent_pos[1],
                self.current_goal[0],
                self.current_goal[1],
                dist_to_goal,
                self.energy,
            ],
            dtype=np.float32,
        )
        return obs

    def _is_blocked(self, x, y):
        """Check if position is blocked by obstacle or boundary."""
        if x < 0 or x >= self.grid_size or y < 0 or y >= self.grid_size:
            return True
        if (x, y) in self.static_obstacles:
            return True
        return False

    def step(self, action):
        """
        Execute one step of the environment.
        
        Args:
            action: int in [0, 1, 2, 3] for [up, down, left, right]
            
        Returns:
            observation, reward, terminated, truncated, info
        """
        self.step_count += 1
        self.energy = max(0.0, self.energy - 0.002)  # Decay energy

        # Move based on action: up/down/left/right
        new_pos = self.agent_pos.copy()
        if action == 0:  # up
            new_pos[1] = min(self.grid_size - 1, new_pos[1] + 1)
        elif action == 1:  # down
            new_pos[1] = max(0, new_pos[1] - 1)
        elif action == 2:  # left
            new_pos[0] = max(0, new_pos[0] - 1)
        elif action == 3:  # right
            new_pos[0] = min(self.grid_size - 1, new_pos[0] + 1)

        # Check collision
        if not self._is_blocked(int(new_pos[0]), int(new_pos[1])):
            self.agent_pos = new_pos

        reward = -0.01  # Step cost

        # Check if goal reached
        dist_to_goal = np.linalg.norm(np.array(self.current_goal) - self.agent_pos)
        if dist_to_goal < 1.0:
            reward += 1.0
            self.current_goal_idx = (self.current_goal_idx + 1) % len(
                self.goal_positions
            )
            self.current_goal = self.goal_positions[self.current_goal_idx]

        terminated = self.energy <= 0
        truncated = self.step_count >= self.max_steps

        obs = self._get_observation()
        return obs, reward, terminated, truncated, {}

    def reset(self, seed=None, options=None):
        """
        Reset the environment.
        
        Returns:
            observation, info
        """
        super().reset(seed=seed)
        self.agent_pos = np.array(self.start_positions[0], dtype=np.float32)
        self.energy = 1.0
        self.step_count = 0
        self.current_goal_idx = 0
        self.current_goal = self.goal_positions[self.current_goal_idx]
        obs = self._get_observation()
        return obs, {}

    def render(self):
        """Render not implemented."""
        pass

    def close(self):
        """Close environment."""
        pass
