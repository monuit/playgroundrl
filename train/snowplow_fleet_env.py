"""
Snowplow Fleet Environment
Multi-agent continuous control in snow clearing task using Gymnasium
"""

import gymnasium as gym
import numpy as np
from gymnasium import spaces


class SnowplowFleetEnv(gym.Env):
    """
    Two snowplows clearing roads.
    State per plow: [x, y, goal_x, goal_y, distance, angle, snow_depth (16), traffic (8),
                    salt, fuel] = 30D
    Action per plow: Continuous(3) - [turn_angle, speed, plow_angle]
    Reward: -0.01 per step, +0.3 per cell cleared, +0.2 for coverage efficiency, -0.5 traffic collision
    """

    metadata = {"render_modes": ["rgb_array"], "render_fps": 30}

    def __init__(self, level_config=None):
        """Initialize the multi-agent snowplow environment."""
        self.grid_size = 25
        self.num_agents = 2
        self.num_depth_readings = 16

        if level_config is None:
            level_config = {
                "gridSize": 25,
                "staticObstacles": [
                    {"x": 10, "y": 10},
                    {"x": 15, "y": 15},
                ],
                "goalPositions": [
                    {"x": 24, "y": 0},
                    {"x": 0, "y": 24},
                ],
                "startPositions": [
                    {"x": 0, "y": 0},
                    {"x": 24, "y": 24},
                ],
                "movingObstacles": [
                    {"id": "car_1", "x": 12, "y": 12, "pathX": [5, 20], "pathY": [5, 20], "speed": 0.1, "phase": 0},
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
        self.moving_obstacles = level_config.get("movingObstacles", [])

        # Observation: [x, y, goal_x, goal_y, distance, angle, 16*snow_depth, 8*traffic, salt, fuel] = 30D
        self.observation_space = spaces.Box(
            low=-1.0, high=float(self.grid_size) + 1, shape=(30,), dtype=np.float32
        )

        # Action: continuous [turn_angle, speed, plow_angle]
        self.action_space = spaces.Box(
            low=-1.0, high=1.0, shape=(3,), dtype=np.float32
        )

        self.agent_pos = [np.array(pos, dtype=np.float32) for pos in self.start_positions]
        self.agent_angle = [0.0] * self.num_agents
        self.agent_salt = [1.0] * self.num_agents
        self.agent_fuel = [1.0] * self.num_agents
        self.cleared_cells = [set() for _ in range(self.num_agents)]
        self.step_count = 0
        self.max_steps = 500

    def _get_snow_depth_map(self):
        """Get snow depth readings (varies with time/location)."""
        depth = np.zeros(self.num_depth_readings, dtype=np.float32)
        for i in range(self.num_depth_readings):
            # Vary based on location and time
            base = 0.7 + 0.2 * np.sin(self.step_count * 0.01 + i * 0.4)
            depth[i] = max(0.0, min(1.0, base))
        return depth

    def _get_traffic_density(self, agent_pos):
        """Get local traffic density around agent."""
        traffic = np.zeros(8, dtype=np.float32)
        for obs_idx, obs in enumerate(self.moving_obstacles):
            if obs_idx < 8:
                obs_pos = np.array([obs["x"], obs["y"]], dtype=np.float32)
                offset = obs_pos - agent_pos
                dist = np.linalg.norm(offset)
                if dist < 5.0:
                    traffic[obs_idx] = max(0.0, 1.0 - dist / 5.0)
        return traffic

    def _get_observation(self, agent_idx):
        """Get observation for agent."""
        pos = self.agent_pos[agent_idx]
        goal = self.goal_positions[agent_idx % len(self.goal_positions)]
        dist = np.linalg.norm(np.array(goal) - pos)

        # Snow depth map
        snow_depth = self._get_snow_depth_map()

        # Traffic density
        traffic = self._get_traffic_density(pos)

        obs = np.concatenate(
            [
                pos,
                np.array(goal, dtype=np.float32),
                np.array([dist], dtype=np.float32),
                np.array([self.agent_angle[agent_idx]], dtype=np.float32),
                snow_depth,
                traffic,
                np.array([self.agent_salt[agent_idx]], dtype=np.float32),
                np.array([self.agent_fuel[agent_idx]], dtype=np.float32),
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
            
            if isinstance(action, (int, float, np.integer)):
                action = np.array([action, 0, 0])
            elif len(action) < 3:
                action = np.concatenate([action, np.zeros(3 - len(action))])

            self.agent_fuel[i] = max(0.0, self.agent_fuel[i] - 0.01)
            self.agent_salt[i] = max(0.0, self.agent_salt[i] - 0.005)

            # Apply action
            self.agent_angle[i] += action[0] * 0.3
            speed = max(0.0, action[1])
            self.agent_pos[i][0] += speed * 0.5 * np.cos(self.agent_angle[i])
            self.agent_pos[i][1] += speed * 0.5 * np.sin(self.agent_angle[i])

            # Boundary
            self.agent_pos[i] = np.clip(self.agent_pos[i], 0, self.grid_size - 1)

            # Track cleared cells
            cell = (int(self.agent_pos[i][0]), int(self.agent_pos[i][1]))
            if cell not in self.cleared_cells[i]:
                self.cleared_cells[i].add(cell)
                rewards[i] += 0.3

            rewards[i] -= 0.01

        obs = np.array([self._get_observation(i) for i in range(self.num_agents)])
        terminateds = np.array([fuel <= 0 for fuel in self.agent_fuel])
        truncateds = np.array([self.step_count >= self.max_steps] * self.num_agents)

        return obs, rewards, terminateds, truncateds, {}

    def reset(self, seed=None, options=None):
        """Reset environment."""
        super().reset(seed=seed)
        self.agent_pos = [np.array(pos, dtype=np.float32) for pos in self.start_positions]
        self.agent_angle = [0.0] * self.num_agents
        self.agent_salt = [1.0] * self.num_agents
        self.agent_fuel = [1.0] * self.num_agents
        self.cleared_cells = [set() for _ in range(self.num_agents)]
        self.step_count = 0
        obs = np.array([self._get_observation(i) for i in range(self.num_agents)])
        return obs, {}

    def render(self):
        """Render not implemented."""
        pass

    def close(self):
        """Close environment."""
        pass
