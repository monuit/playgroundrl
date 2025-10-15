"""
Gymnasium-based RL Environments for PlaygroundRL

This package provides 5 multi-agent RL environments:
- BunnyGardenEnv: Single-agent discrete navigation
- SwarmDronesEnv: 4-agent continuous exploration
- ReefGuardiansEnv: 6-agent continuous underwater task
- WarehouseBotsEnv: 3-agent discrete warehouse automation
- SnowplowFleetEnv: 2-agent continuous snow clearing
"""

from bunny_garden_env import BunnyGardenEnv
from swarm_drones_env import SwarmDronesEnv
from reef_guardians_env import ReefGuardiansEnv
from warehouse_bots_env import WarehouseBotsEnv
from snowplow_fleet_env import SnowplowFleetEnv

__all__ = [
    "BunnyGardenEnv",
    "SwarmDronesEnv",
    "ReefGuardiansEnv",
    "WarehouseBotsEnv",
    "SnowplowFleetEnv",
]
