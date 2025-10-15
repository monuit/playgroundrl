import Dexie, { type Table } from "dexie";

export interface RunManifest {
  id: string;
  createdAt: string;
  envId: string;
  algoId: string;
  backend: "tfjs" | "pyodide";
  seed: string;
  hyper?: Record<string, unknown>;
  rewardSource?: string;
  notes?: string;
  version: number;
}

export interface CheckpointRecord {
  id?: number;
  runId: string;
  step: number;
  episode: number;
  rewardMean: number;
  createdAt: string;
  weights: ArrayBuffer;
  label?: string;
  pinned?: boolean;
  notes?: string;
  updatedAt?: string;
}

export interface MetricRecord {
  id?: number;
  runId: string;
  episode: number;
  reward: number;
  steps: number;
  timestamp: string;
  loss?: number;
  entropy?: number;
  learningRate?: number;
  stepsPerSecond?: number;
  timeMs?: number;
}

export interface BlobRecord {
  id?: number;
  runId: string;
  key: string;
  data: ArrayBuffer;
}

class PlaygroundRLDatabase extends Dexie {
  runs!: Table<RunManifest, string>;
  checkpoints!: Table<CheckpointRecord, number>;
  metrics!: Table<MetricRecord, number>;
  blobs!: Table<BlobRecord, number>;

  constructor() {
    super("playgroundrl");
    this.version(1).stores({
      runs: "&id, createdAt",
      checkpoints: "++id, runId, createdAt",
      metrics: "++id, runId, timestamp",
      blobs: "++id, runId, key",
    });
    this.version(2).stores({
      runs: "&id, createdAt",
      checkpoints: "++id, runId, createdAt",
      metrics: "++id, runId, timestamp",
      blobs: "++id, [runId+key], runId, key",
    });
    this.version(3)
      .stores({
        runs: "&id, createdAt",
        checkpoints: "++id, runId, createdAt, pinned",
        metrics: "++id, runId, timestamp",
        blobs: "++id, [runId+key], runId, key",
      })
      .upgrade((tx) => {
        return Promise.all([
          tx.table("checkpoints").toCollection().modify((checkpoint) => {
            if (!("pinned" in checkpoint)) {
              checkpoint.pinned = false;
            }
            if (!("updatedAt" in checkpoint)) {
              checkpoint.updatedAt = checkpoint.createdAt;
            }
          }),
        ]);
      });
  }
}

let database: PlaygroundRLDatabase | null = null;

export const getDatabase = () => {
  if (!database) {
    if (typeof window === "undefined") {
      throw new Error("IndexedDB is only available in the browser");
    }
    database = new PlaygroundRLDatabase();
  }
  return database;
};

export const createRunManifest = async (manifest: RunManifest) => {
  const db = getDatabase();
  await db.runs.put(manifest);
};

export const appendMetric = async (metric: MetricRecord) => {
  const db = getDatabase();
  await db.metrics.add(metric);
};

export const addCheckpoint = async (record: CheckpointRecord) => {
  const db = getDatabase();
  await db.checkpoints.add(record);
};

export const updateCheckpoint = async (
  id: number,
  patch: Partial<Omit<CheckpointRecord, "id" | "runId" | "weights">>
) => {
  const db = getDatabase();
  await db.checkpoints.update(id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
};

export const storeBlob = async (record: BlobRecord) => {
  const db = getDatabase();
  const existing = await db.blobs
    .where("[runId+key]")
    .equals([record.runId, record.key])
    .first();
  if (existing) {
    await db.blobs.update(existing.id!, { data: record.data });
  } else {
    await db.blobs.add(record);
  }
};

export const fetchRun = async (runId: string) => {
  const db = getDatabase();
  return db.runs.get(runId);
};

export const fetchMetrics = async (runId: string) => {
  const db = getDatabase();
  return db.metrics.where("runId").equals(runId).toArray();
};

export const fetchCheckpoints = async (runId: string) => {
  const db = getDatabase();
  return db.checkpoints.where("runId").equals(runId).toArray();
};

export const getCheckpoint = async (id: number) => {
  const db = getDatabase();
  return db.checkpoints.get(id);
};

export const fetchBlobs = async (runId: string) => {
  const db = getDatabase();
  return db.blobs.where("runId").equals(runId).toArray();
};

export const listRuns = async () => {
  const db = getDatabase();
  return db.runs.orderBy("createdAt").reverse().toArray();
};

export const deleteRun = async (runId: string) => {
  const db = getDatabase();
  await db.transaction("rw", db.runs, db.checkpoints, db.metrics, db.blobs, async () => {
    await db.checkpoints.where("runId").equals(runId).delete();
    await db.metrics.where("runId").equals(runId).delete();
    await db.blobs.where("runId").equals(runId).delete();
    await db.runs.delete(runId);
  });
};

export const deleteCheckpointRecord = async (id: number) => {
  const db = getDatabase();
  await db.checkpoints.delete(id);
};

export const listPinnedCheckpoints = async (runId: string) => {
  const db = getDatabase();
  return db.checkpoints.where({ runId, pinned: true }).sortBy("createdAt");
};




