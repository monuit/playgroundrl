import { get, getAll } from "@vercel/edge-config";

export type AgentMode = "bunny" | "drone" | "reef" | "warehouse" | "snowplow";

type EdgeConfigRecord = Partial<Record<keyof PlaygroundEdgeConfig, unknown>>;

export interface PlaygroundEdgeConfig {
  featureFlags: {
    maintenanceMode: boolean;
    enabledAgents: AgentMode[];
    defaultAvatar: AgentMode;
  };
  caching: {
    runtimeConfigTtlSeconds: number;
    redisNamespace: string;
  };
  telemetry: {
    sampleRate: number;
  };
}

export const EDGE_CONFIG_DEFAULTS = {
  featureFlags: {
    maintenanceMode: false,
    enabledAgents: ["bunny", "drone", "reef", "warehouse", "snowplow"],
    defaultAvatar: "bunny",
  },
  caching: {
    runtimeConfigTtlSeconds: 180,
    redisNamespace: "playgroundrl",
  },
  telemetry: {
    sampleRate: 0,
  },
} as const satisfies PlaygroundEdgeConfig;

const EDGE_CONFIG_AVAILABLE = Boolean(process.env.EDGE_CONFIG || process.env.VERCEL_EDGE_CONFIG);

const mergeWithDefaults = (record: EdgeConfigRecord): PlaygroundEdgeConfig => ({
  featureFlags: {
    ...EDGE_CONFIG_DEFAULTS.featureFlags,
    ...(record.featureFlags as PlaygroundEdgeConfig["featureFlags"] | undefined),
  },
  caching: {
    ...EDGE_CONFIG_DEFAULTS.caching,
    ...(record.caching as PlaygroundEdgeConfig["caching"] | undefined),
  },
  telemetry: {
    ...EDGE_CONFIG_DEFAULTS.telemetry,
    ...(record.telemetry as PlaygroundEdgeConfig["telemetry"] | undefined),
  },
});

const warn = (message: string, metadata?: Record<string, unknown>) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[edge-config] ${message}`, metadata);
  }
};

export async function readEdgeConfigSnapshot(): Promise<PlaygroundEdgeConfig> {
  if (!EDGE_CONFIG_AVAILABLE) {
    warn("Edge Config not configured. Using defaults only.");
    return EDGE_CONFIG_DEFAULTS;
  }

  try {
    const snapshot = await getAll<EdgeConfigRecord>();
    if (!snapshot) {
      warn("Received empty snapshot. Using defaults.");
      return EDGE_CONFIG_DEFAULTS;
    }
    return mergeWithDefaults(snapshot);
  } catch (error) {
    warn("Failed to fetch Edge Config snapshot. Falling back to defaults.", { error });
    return EDGE_CONFIG_DEFAULTS;
  }
}

export async function readEdgeConfigValue<Key extends keyof PlaygroundEdgeConfig>(
  key: Key,
): Promise<PlaygroundEdgeConfig[Key]> {
  if (!EDGE_CONFIG_AVAILABLE) {
    warn(`Edge Config not configured. Using default for '${key}'.`);
    return EDGE_CONFIG_DEFAULTS[key];
  }

  try {
    const value = await get<PlaygroundEdgeConfig[Key]>(key);
    if (value === null || value === undefined) {
      warn(`Edge Config returned null for '${key}'. Using default.`);
      return EDGE_CONFIG_DEFAULTS[key];
    }
    if (key === "featureFlags") {
      const flags = value as PlaygroundEdgeConfig["featureFlags"];
      return {
        ...EDGE_CONFIG_DEFAULTS.featureFlags,
        ...flags,
        enabledAgents: Array.from(new Set(flags.enabledAgents ?? EDGE_CONFIG_DEFAULTS.featureFlags.enabledAgents)),
      } as PlaygroundEdgeConfig[Key];
    }
    return {
      ...EDGE_CONFIG_DEFAULTS[key],
      ...(value as Record<string, unknown>),
    } as PlaygroundEdgeConfig[Key];
  } catch (error) {
    warn(`Failed to fetch Edge Config value '${key}'. Using default.`, { error });
    return EDGE_CONFIG_DEFAULTS[key];
  }
}

export const EDGE_CONFIG_CACHE_KEY = "edge-config:snapshot";

export const EDGE_CONFIG_CACHE_TTL_SECONDS = EDGE_CONFIG_DEFAULTS.caching.runtimeConfigTtlSeconds;
