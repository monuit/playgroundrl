import type { ComponentType } from "react";
import type { EnvFactory } from "./types";
import { SwarmDronesDefinition } from "./swarm_drones";
import { ReefGuardiansDefinition } from "./reef_guardians";
import { WarehouseBotsDefinition } from "./warehouse_bots";
import { SnowplowFleetDefinition } from "./snowplow_fleet";
import { BunnyGardenDefinition } from "./bunny_garden";
import { MazeDefinition } from "./maze";
import { PongDefinition } from "./pong";
import { CartPoleDefinition } from "./cartpole";
import { FlappyLiteDefinition } from "./flappy_lite";
import { MountainCarDefinition } from "./mountain_car";
import { TinyGridDefinition } from "./tiny_grid";

export interface EnvDefinition<State = unknown> extends EnvFactory {
  Scene: ComponentType<{ state: State }>;
}

export type EnvRegistryDefinition = EnvFactory & {
  Scene: ComponentType<{ state: unknown }>;
};

const coerceDefinition = <State,>(
  definition: EnvDefinition<State>
): EnvRegistryDefinition => ({
  ...definition,
  Scene: definition.Scene as ComponentType<{ state: unknown }>,
});

export const ENVIRONMENTS: EnvRegistryDefinition[] = [
  coerceDefinition(SwarmDronesDefinition),
  coerceDefinition(ReefGuardiansDefinition),
  coerceDefinition(WarehouseBotsDefinition),
  coerceDefinition(SnowplowFleetDefinition),
  coerceDefinition(BunnyGardenDefinition),
  coerceDefinition(MazeDefinition),
  coerceDefinition(PongDefinition),
  coerceDefinition(CartPoleDefinition),
  coerceDefinition(FlappyLiteDefinition),
  coerceDefinition(MountainCarDefinition),
];

export const ENV_LOOKUP = ENVIRONMENTS.reduce<
  Record<string, EnvRegistryDefinition>
>((acc, definition) => {
  acc[definition.id] = definition;
  return acc;
}, {});

export {
  SwarmDronesDefinition,
  ReefGuardiansDefinition,
  WarehouseBotsDefinition,
  SnowplowFleetDefinition,
  BunnyGardenDefinition,
  MazeDefinition,
  PongDefinition,
  CartPoleDefinition,
  FlappyLiteDefinition,
  MountainCarDefinition,
  TinyGridDefinition,
};
export type { SwarmDronesRenderableState } from "./swarm_drones";
export type { ReefGuardiansRenderableState } from "./reef_guardians";
export type { WarehouseBotsRenderableState } from "./warehouse_bots";
export type { SnowplowFleetRenderableState } from "./snowplow_fleet";
export type { BunnyRenderableState } from "./bunny_garden";
export type { MazeRenderableState } from "./maze";
export type { PongRenderableState } from "./pong";
export type { CartPoleMetadata as CartPoleRenderableState } from "./cartpole";
export type { FlappyMetadata as FlappyLiteRenderableState } from "./flappy_lite";
export type { MountainCarMetadata } from "./mountain_car";
export type { TinyGridMetadata } from "./tiny_grid";
export * from "./types";

