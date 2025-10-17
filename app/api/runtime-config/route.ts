import { NextResponse } from "next/server";
import {
  EDGE_CONFIG_CACHE_KEY,
  EDGE_CONFIG_DEFAULTS,
  readEdgeConfigSnapshot,
} from "@/lib/edge-config";
import { readCache, writeCache } from "@/lib/redis";

export const runtime = "edge";

interface RuntimeConfigResponse {
  config: Awaited<ReturnType<typeof readEdgeConfigSnapshot>>;
  source: "cache" | "live" | "fallback";
  cachedAt: string | null;
}

export async function GET() {
  const cached = await readCache<RuntimeConfigResponse["config"]>(EDGE_CONFIG_CACHE_KEY);

  if (cached) {
    return NextResponse.json<RuntimeConfigResponse>(
      {
        config: cached,
        source: "cache",
        cachedAt: new Date().toISOString(),
      },
      {
        headers: {
          "x-playgroundrl-cache": "HIT",
        },
      },
    );
  }

  try {
    const config = await readEdgeConfigSnapshot();
    const ttlSeconds = config.caching.runtimeConfigTtlSeconds;
    if (ttlSeconds > 0) {
      await writeCache(EDGE_CONFIG_CACHE_KEY, config, { ttlSeconds });
    }
    return NextResponse.json<RuntimeConfigResponse>(
      {
        config,
        source: "live",
        cachedAt: new Date().toISOString(),
      },
      {
        headers: {
          "x-playgroundrl-cache": ttlSeconds > 0 ? "MISS" : "BYPASS",
        },
      },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[runtime-config] Falling back to defaults due to error.", { error });
    }
    return NextResponse.json<RuntimeConfigResponse>(
      {
        config: EDGE_CONFIG_DEFAULTS,
        source: "fallback",
        cachedAt: null,
      },
      {
        status: 200,
        headers: {
          "x-playgroundrl-cache": "ERROR",
        },
      },
    );
  }
}
