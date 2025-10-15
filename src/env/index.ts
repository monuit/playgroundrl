import type { ComponentType } from "react";
import type { EnvFactory } from "./types";
import { SwarmDronesDefinition } from "./swarm_drones";
import { ReefGuardiansDefinition } from "./reef_guardians";
import { WarehouseBotsDefinition } from "./warehouse_bots";
import { SnowplowFleetDefinition } from "./snowplow_fleet";

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
};
export type { SwarmDronesRenderableState } from "./swarm_drones";
export type { ReefGuardiansRenderableState } from "./reef_guardians";
export type { WarehouseBotsRenderableState } from "./warehouse_bots";
export type { SnowplowFleetRenderableState } from "./snowplow_fleet";
export * from "./types";

