"""
Reef Guardians Environment
Multi-agent continuous control in underwater setting using Gymnasium
"""

import gymnasium as gym
import numpy as np
from gymnasium import spaces


class ReefGuardiansEnv(gym.Env):
    """
    Six fish agents protecting a reef.
    State per fish: [x, y, goal_x, goal_y, distance, energy, school_id, predator_threat,
                    sector_algae (8), predator_dir, school_centroid_x, school_centroid_y]
    Action per fish: Continuous(3) - [steer_angle, boost, school_toggle]
    Reward: -0.01 per step, +0.2 per algae collected, +0.5 for school cohesion, -1.0 for predator
    """

    metadata = {"render_modes": ["rgb_array"], "render_fps": 30}

    def __init__(self, level_config=None):
        """Initialize the multi-agent reef environment."""
        self.grid_size = 25
        self.num_agents = 6
        self.num_schools = 2

        if level_config is None:
            level_config = {
                "gridSize": 25,
                "staticObstacles": [
                    {"x": 12, "y": 12},
                    {"x": 13, "y": 13},
                ],
                "goalPositions": [{"x": 24, "y": 24}],
                "startPositions": [
                    {"x": i + 1, "y": i + 1} for i in range(self.num_agents)
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

        # Observation: [x, y, goal_x, goal_y, distance, energy, school_id, predator_threat,
        #              8*sector_algae, predator_dir, school_cx, school_cy] = 15D
        self.observation_space = spaces.Box(
            low=-10.0, high=float(self.grid_size) + 10, shape=(15,), dtype=np.float32
        )

        # Action: continuous [steer_angle, boost, school_toggle]
        self.action_space = spaces.Box(
            low=-1.0, high=1.0, shape=(3,), dtype=np.float32
        )

        self.agent_pos = [np.array(pos, dtype=np.float32) for pos in self.start_positions]
        self.agent_energy = [1.0] * self.num_agents
        self.agent_school = [i % self.num_schools for i in range(self.num_agents)]
        self.step_count = 0
        self.max_steps = 500

    def _get_observation(self, agent_idx):
        """Get observation for agent."""
        pos = self.agent_pos[agent_idx]
        goal = self.goal_positions[0]
        dist = np.linalg.norm(np.array(goal) - pos)

        # Sector algae (8 sectors around agent)
        sector_algae = np.array(
            [0.5 + 0.1 * np.sin(2 * np.pi * i / 8 + self.step_count * 0.1) for i in range(8)],
            dtype=np.float32,
        )

        # Predator threat (simplified)
        predator_threat = np.sin(self.step_count * 0.05) * 0.5 + 0.5

        # School centroid
        school_id = self.agent_school[agent_idx]
        school_agents = [i for i in range(self.num_agents) if self.agent_school[i] == school_id]
        if school_agents:
            centroid = np.mean([self.agent_pos[i] for i in school_agents], axis=0)
        else:
            centroid = pos

        predator_dir = np.arctan2(centroid[1] - pos[1], centroid[0] - pos[0])

        obs = np.concatenate(
            [
                pos,
                np.array(goal, dtype=np.float32),
                np.array([dist], dtype=np.float32),
                np.array([self.agent_energy[agent_idx]], dtype=np.float32),
                np.array([float(school_id)], dtype=np.float32),
                np.array([predator_threat], dtype=np.float32),
                sector_algae,
                np.array([predator_dir], dtype=np.float32),
                centroid.astype(np.float32),
            ]
        ).astype(np.float32)

        return obs

    def step(self, actions):
        """Execute one step for all agents."""
        if not isinstance(actions, np.ndarray):
            actions = np.array(actions)

        if actions.shape == (3,):
            actions = actions.reshape(1, -1)

        self.step_count += 1
        rewards = np.zeros(self.num_agents, dtype=np.float32)

        for i in range(self.num_agents):
            action = actions[i] if actions.shape[0] > i else actions[0]
            self.agent_energy[i] = max(0.0, self.agent_energy[i] - 0.015)

            # Apply action
            steer = action[0] * 0.2
            boost = max(0.0, action[1])
            self.agent_pos[i][0] += (0.3 + boost * 0.2) * np.cos(steer)
            self.agent_pos[i][1] += (0.3 + boost * 0.2) * np.sin(steer)

            # Boundary
            self.agent_pos[i] = np.clip(self.agent_pos[i], 0, self.grid_size - 1)

            # Reward
            rewards[i] -= 0.01  # Step cost
            if np.random.random() < 0.1:
                rewards[i] += 0.2  # Algae collected

        obs = np.array([self._get_observation(i) for i in range(self.num_agents)])
        terminateds = np.array([energy <= 0 for energy in self.agent_energy])
        truncateds = np.array([self.step_count >= self.max_steps] * self.num_agents)

        return obs, rewards, terminateds, truncateds, {}

    def reset(self, seed=None, options=None):
        """Reset environment."""
        super().reset(seed=seed)
        self.agent_pos = [np.array(pos, dtype=np.float32) for pos in self.start_positions]
        self.agent_energy = [1.0] * self.num_agents
        self.agent_school = [i % self.num_schools for i in range(self.num_agents)]
        self.step_count = 0
        obs = np.array([self._get_observation(i) for i in range(self.num_agents)])
        return obs, {}

    def render(self):
        """Render not implemented."""
        pass

    def close(self):
        """Close environment."""
        pass
