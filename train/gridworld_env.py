"""
Grid World Environment for RL Training
25x25 grid with obstacles, rewards, and multi-agent support
"""
import gymnasium as gym
import numpy as np
from gymnasium import spaces
from typing import Optional, Tuple, Dict, Any


class GridWorldEnv(gym.Env):
    """
    25x25 Grid World environment for training PPO agents
    
    Observation: [agent_x, agent_y, goal_x, goal_y, dist_to_goal]
    Action: 0=UP, 1=DOWN, 2=LEFT, 3=RIGHT (discrete 4)
    """
    
    metadata = {"render_modes": ["human"], "render_fps": 4}
    
    GRID_SIZE = 25
    
    # Action space
    UP = 0
    DOWN = 1
    LEFT = 2
    RIGHT = 3
    
    def __init__(
        self,
        level: str = "level1",
        render_mode: Optional[str] = None,
        seed: Optional[int] = None,
    ):
        self.render_mode = render_mode
        self.level = level
        self.seed_value = seed
        
        # Define observation and action spaces
        self.observation_space = spaces.Box(
            low=0, high=self.GRID_SIZE, shape=(5,), dtype=np.float32
        )
        self.action_space = spaces.Discrete(4)
        
        # Initialize state
        self.agent_pos = np.array([1, 1], dtype=np.int32)
        self.goal_pos = np.array([23, 23], dtype=np.int32)
        self.steps = 0
        self.max_steps = 100
        
        # Define obstacles based on level
        if level == "level1":
            self._init_level_one()
        elif level == "level2":
            self._init_level_two()
        else:
            raise ValueError(f"Unknown level: {level}")
    
    def _init_level_one(self):
        """Static obstacles"""
        # Create border
        self.static_obstacles = set()
        for i in range(self.GRID_SIZE):
            self.static_obstacles.add((i, 0))
            self.static_obstacles.add((i, self.GRID_SIZE - 1))
            self.static_obstacles.add((0, i))
            self.static_obstacles.add((self.GRID_SIZE - 1, i))
        
        # Add interior walls
        for i in range(12):
            self.static_obstacles.add((6, 2 + i))
        for i in range(10):
            self.static_obstacles.add((12, 3 + i))
        for i in range(12):
            self.static_obstacles.add((18, 2 + i))
        
        self.moving_obstacles = {}
    
    def _init_level_two(self):
        """Static obstacles + moving obstacles"""
        # Border only
        self.static_obstacles = set()
        for i in range(self.GRID_SIZE):
            self.static_obstacles.add((i, 0))
            self.static_obstacles.add((i, self.GRID_SIZE - 1))
            self.static_obstacles.add((0, i))
            self.static_obstacles.add((self.GRID_SIZE - 1, i))
        
        # Moving obstacles: { id: (x, y, path_x, path_y, speed, phase, time) }
        self.moving_obstacles = {
            "mov1": {"x": 12, "y": 5, "path_x": [8, 16], "path_y": [5, 5], "speed": 2, "phase": 0, "t": 0},
            "mov2": {"x": 12, "y": 12, "path_x": [12, 12], "path_y": [8, 16], "speed": 2, "phase": 0, "t": 0},
            "mov3": {"x": 12, "y": 19, "path_x": [6, 18], "path_y": [19, 19], "speed": 2.5, "phase": 1, "t": 0},
        }
    
    def _update_moving_obstacles(self):
        """Update moving obstacle positions"""
        if not self.moving_obstacles:
            return
        
        for obs_id, obs in self.moving_obstacles.items():
            obs["t"] += 0.1  # Increment time
            progress = (np.sin((obs["t"] + obs["phase"]) * obs["speed"]) + 1) / 2
            
            min_x, max_x = obs["path_x"]
            min_y, max_y = obs["path_y"]
            
            obs["x"] = int(min_x + (max_x - min_x) * progress)
            obs["y"] = int(min_y + (max_y - min_y) * progress)
    
    def _get_occupied_cells(self) -> set:
        """Get all occupied cells (static + moving obstacles)"""
        occupied = self.static_obstacles.copy()
        for obs in self.moving_obstacles.values():
            occupied.add((obs["x"], obs["y"]))
        return occupied
    
    def _get_observation(self) -> np.ndarray:
        """Build observation vector"""
        goal_x, goal_y = self.goal_pos
        agent_x, agent_y = self.agent_pos
        
        dist = np.sqrt((goal_x - agent_x) ** 2 + (goal_y - agent_y) ** 2)
        
        return np.array(
            [agent_x, agent_y, goal_x, goal_y, dist],
            dtype=np.float32
        )
    
    def _compute_reward(self, done: bool, hit_obstacle: bool) -> float:
        """Compute step reward"""
        if hit_obstacle:
            return -1.0
        
        if done:  # Reached goal
            return 1.0
        
        return -0.01  # Step penalty
    
    def reset(
        self, seed: Optional[int] = None, options: Optional[Dict[str, Any]] = None
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Reset environment"""
        super().reset(seed=seed)
        
        if seed is not None:
            np.random.seed(seed)
        
        self.agent_pos = np.array([1, 1], dtype=np.int32)
        self.steps = 0
        
        obs = self._get_observation()
        return obs, {}
    
    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, Dict[str, Any]]:
        """Execute one step"""
        # Update moving obstacles
        self._update_moving_obstacles()
        
        # Apply action
        old_pos = self.agent_pos.copy()
        
        if action == self.UP:
            self.agent_pos[1] = max(0, self.agent_pos[1] - 1)
        elif action == self.DOWN:
            self.agent_pos[1] = min(self.GRID_SIZE - 1, self.agent_pos[1] + 1)
        elif action == self.LEFT:
            self.agent_pos[0] = max(0, self.agent_pos[0] - 1)
        elif action == self.RIGHT:
            self.agent_pos[0] = min(self.GRID_SIZE - 1, self.agent_pos[0] + 1)
        
        # Check collisions
        occupied = self._get_occupied_cells()
        hit_obstacle = tuple(self.agent_pos) in occupied
        
        if hit_obstacle:
            # Revert position
            self.agent_pos = old_pos
        
        # Check goal
        reached_goal = np.array_equal(self.agent_pos, self.goal_pos)
        
        # Compute reward
        reward = self._compute_reward(reached_goal, hit_obstacle)
        
        # Terminal conditions
        self.steps += 1
        terminated = reached_goal or hit_obstacle
        truncated = self.steps >= self.max_steps
        
        obs = self._get_observation()
        
        return obs, reward, terminated, truncated, {}
    
    def render(self):
        """Render environment (optional)"""
        if self.render_mode == "human":
            grid = [["." for _ in range(self.GRID_SIZE)] for _ in range(self.GRID_SIZE)]
            
            # Draw obstacles
            for x, y in self.static_obstacles:
                grid[y][x] = "#"
            
            # Draw moving obstacles
            for obs in self.moving_obstacles.values():
                x, y = int(obs["x"]), int(obs["y"])
                if 0 <= x < self.GRID_SIZE and 0 <= y < self.GRID_SIZE:
                    grid[y][x] = "~"
            
            # Draw goal
            gx, gy = self.goal_pos
            grid[gy][gx] = "G"
            
            # Draw agent
            ax, ay = self.agent_pos
            grid[ay][ax] = "A"
            
            print("\n".join("".join(row) for row in grid))
            print()
