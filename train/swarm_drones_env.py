"""
Swarm Drones Environment
Multi-agent continuous control task using Gymnasium
"""

import gymnasium as gym
import numpy as np
from gymnasium import spaces


class SwarmDronesEnv(gym.Env):
    """
    Four drones exploring a space with continuous control.
    State per drone: [agent_x, agent_y, goal_x, goal_y, distance, battery, angle, 
                      lidar_rays (8), neighbors (8), visited_bit]
    Action per drone: Continuous(4) - [turn, thrust, hover, returnToBase]
    Reward: -0.01 per step, +0.1 per new cell explored, +1.0 for coverage, -0.5 for collision
    """

    metadata = {"render_modes": ["rgb_array"], "render_fps": 30}

    def __init__(self, level_config=None):
        """
        Initialize the multi-agent environment.
        
        Args:
            level_config: Dict with environment configuration
        """
        self.grid_size = 25
        self.num_agents = 4
        self.tile_size = 1.0

        if level_config is None:
            level_config = {
                "gridSize": 25,
                "staticObstacles": [
                    {"x": 10, "y": 10},
                    {"x": 10, "y": 11},
                    {"x": 15, "y": 15},
                ],
                "goalPositions": [{"x": 24, "y": 24}],
                "startPositions": [
                    {"x": 1, "y": 1},
                    {"x": 1, "y": 23},
                    {"x": 23, "y": 1},
                    {"x": 23, "y": 23},
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

        # Observation: [x, y, goal_x, goal_y, distance, battery, angle, 8*lidar, 8*neighbors, visited]
        self.observation_space = spaces.Box(
            low=-10.0, high=float(self.grid_size) + 10, shape=(26,), dtype=np.float32
        )

        # Action: continuous [turn, thrust, hover, return_to_base]
        self.action_space = spaces.Box(
            low=-1.0, high=1.0, shape=(4,), dtype=np.float32
        )

        self.agent_pos = [np.array(pos, dtype=np.float32) for pos in self.start_positions]
        self.agent_battery = [1.0] * self.num_agents
        self.agent_angle = [0.0] * self.num_agents
        self.visited_cells = [set() for _ in range(self.num_agents)]
        self.step_count = 0
        self.max_steps = 500

    def _get_observation(self, agent_idx):
        """Get observation for agent."""
        pos = self.agent_pos[agent_idx]
        goal = self.goal_positions[0]
        dist = np.linalg.norm(np.array(goal) - pos)

        # Lidar rays (8 directions)
        lidar = np.zeros(8, dtype=np.float32)
        for i in range(8):
            angle = 2 * np.pi * i / 8
            for r in range(1, int(self.grid_size / 2)):
                check_x = pos[0] + r * np.cos(angle)
                check_y = pos[1] + r * np.sin(angle)
                if (int(check_x), int(check_y)) in self.static_obstacles:
                    lidar[i] = float(r)
                    break
            if lidar[i] == 0:
                lidar[i] = float(self.grid_size)

        # Neighbor offsets (simplified: 4 neighbors)
        neighbors = np.zeros(8, dtype=np.float32)
        for i, other_idx in enumerate(range(self.num_agents)):
            if other_idx != agent_idx and i < 4:
                offset = self.agent_pos[other_idx] - pos
                neighbors[2 * i] = offset[0]
                neighbors[2 * i + 1] = offset[1]

        visited_bit = float(len(self.visited_cells[agent_idx]) > 10)

        obs = np.concatenate(
            [
                pos,
                np.array(goal, dtype=np.float32),
                np.array([dist], dtype=np.float32),
                np.array([self.agent_battery[agent_idx]], dtype=np.float32),
                np.array([self.agent_angle[agent_idx]], dtype=np.float32),
                lidar,
                neighbors,
                np.array([visited_bit], dtype=np.float32),
            ]
        ).astype(np.float32)

        return obs

    def step(self, actions):
        """
        Execute one step for all agents.
        
        Args:
            actions: array of shape (num_agents, 4) with continuous actions
            
        Returns:
            observations, rewards, terminateds, truncateds, info
        """
        if not isinstance(actions, np.ndarray):
            actions = np.array(actions)

        if actions.shape == (4,):
            actions = actions.reshape(1, -1)

        self.step_count += 1
        rewards = np.zeros(self.num_agents, dtype=np.float32)

        for i in range(self.num_agents):
            action = actions[i] if actions.shape[0] > i else actions[0]
            self.agent_battery[i] = max(0.0, self.agent_battery[i] - 0.01)

            # Apply action
            thrust = max(0.0, action[1])  # 0-1
            self.agent_angle[i] += action[0] * 0.2  # turn
            self.agent_pos[i][0] += thrust * 0.5 * np.cos(self.agent_angle[i])
            self.agent_pos[i][1] += thrust * 0.5 * np.sin(self.agent_angle[i])

            # Boundary check
            self.agent_pos[i][0] = np.clip(self.agent_pos[i][0], 0, self.grid_size - 1)
            self.agent_pos[i][1] = np.clip(self.agent_pos[i][1], 0, self.grid_size - 1)

            # Track visited cells
            cell = (int(self.agent_pos[i][0]), int(self.agent_pos[i][1]))
            if cell not in self.visited_cells[i]:
                self.visited_cells[i].add(cell)
                rewards[i] += 0.1

            rewards[i] -= 0.01  # Step cost

        obs = np.array([self._get_observation(i) for i in range(self.num_agents)])
        terminateds = np.array([battery <= 0 for battery in self.agent_battery])
        truncateds = np.array([self.step_count >= self.max_steps] * self.num_agents)

        return obs, rewards, terminateds, truncateds, {}

    def reset(self, seed=None, options=None):
        """Reset environment."""
        super().reset(seed=seed)
        self.agent_pos = [np.array(pos, dtype=np.float32) for pos in self.start_positions]
        self.agent_battery = [1.0] * self.num_agents
        self.agent_angle = [0.0] * self.num_agents
        self.visited_cells = [set() for _ in range(self.num_agents)]
        self.step_count = 0
        obs = np.array([self._get_observation(i) for i in range(self.num_agents)])
        return obs, {}

    def render(self):
        """Render not implemented."""
        pass

    def close(self):
        """Close environment."""
        pass
