import { Redis } from "@upstash/redis";
import { EDGE_CONFIG_DEFAULTS } from "./edge-config";

type CacheValue = {
  value: unknown;
  expiresAt: number | null;
};

type WriteCacheOptions = {
  ttlSeconds?: number;
};

const memoryCache = new Map<string, CacheValue>();

let redisClient: Redis | null | undefined;

const resolveRedisClient = (): Redis | null => {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisClient = null;
    if (process.env.NODE_ENV !== "production") {
      console.warn("[redis] Upstash credentials missing. Falling back to in-memory cache.");
    }
    return redisClient;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
};

const maybePruneMemory = (key: string) => {
  const record = memoryCache.get(key);
  if (!record) {
    return;
  }

  if (record.expiresAt !== null && record.expiresAt < Date.now()) {
    memoryCache.delete(key);
  }
};

const makeNamespacedKey = (key: string) => `${EDGE_CONFIG_DEFAULTS.caching.redisNamespace}:${key}`;

export const getRedisClient = (): Redis | null => resolveRedisClient();

export const readCache = async <T>(key: string): Promise<T | null> => {
  const namespacedKey = makeNamespacedKey(key);
  const client = resolveRedisClient();
  if (!client) {
    maybePruneMemory(namespacedKey);
    return (memoryCache.get(namespacedKey)?.value as T | undefined) ?? null;
  }

  try {
    const value = await client.get<T>(namespacedKey);
    return value ?? null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[redis] Failed to read cache. Falling back to memory store.", { error });
    }
    maybePruneMemory(namespacedKey);
    return (memoryCache.get(namespacedKey)?.value as T | undefined) ?? null;
  }
};

export const writeCache = async <T>(key: string, value: T, options: WriteCacheOptions = {}): Promise<void> => {
  const namespacedKey = makeNamespacedKey(key);
  const ttlSeconds = options.ttlSeconds ?? EDGE_CONFIG_DEFAULTS.caching.runtimeConfigTtlSeconds;
  const client = resolveRedisClient();

  if (!client) {
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    memoryCache.set(namespacedKey, { value, expiresAt });
    return;
  }

  try {
    if (ttlSeconds > 0) {
      await client.set(namespacedKey, value, { ex: ttlSeconds });
    } else {
      await client.set(namespacedKey, value);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[redis] Failed to write cache. Writing to memory fallback.", { error });
    }
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    memoryCache.set(namespacedKey, { value, expiresAt });
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  const namespacedKey = makeNamespacedKey(key);
  const client = resolveRedisClient();

  memoryCache.delete(namespacedKey);

  if (!client) {
    return;
  }

  try {
    await client.del(namespacedKey);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[redis] Failed to delete cache key.", { error });
    }
  }
};
