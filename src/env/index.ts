import type { ComponentType } from "react";
import { createMazeEnv, MazeScene, type MazeRenderableState } from "./maze";
import { BunnyGardenDefinition } from "./bunny_garden";
import type { EnvFactory } from "./types";

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

export const MazeDefinition: EnvDefinition<MazeRenderableState> = {
  ...createMazeEnv,
  Scene: MazeScene,
};

export const ENVIRONMENTS: EnvRegistryDefinition[] = [
  coerceDefinition(BunnyGardenDefinition),
  coerceDefinition(MazeDefinition),
];

export const ENV_LOOKUP = ENVIRONMENTS.reduce<
  Record<string, EnvRegistryDefinition>
>((acc, definition) => {
  acc[definition.id] = definition;
  return acc;
}, {});

export { BunnyGardenDefinition };
export type { BunnyRenderableState } from "./bunny_garden";
export type { MazeRenderableState };
export * from "./types";

