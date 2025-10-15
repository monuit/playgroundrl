import JSZip from "jszip";
import {
  addCheckpoint,
  appendMetric,
  createRunManifest,
  deleteRun,
  fetchBlobs,
  fetchCheckpoints,
  fetchMetrics,
  fetchRun,
  storeBlob,
  type CheckpointRecord,
  type MetricRecord,
  type RunManifest,
} from "./persistence";

export type ExportFormat = "zip" | "json";

interface ExportOptions {
  format?: ExportFormat;
}

interface ExportManifest {
  run: RunManifest;
  checkpoints: Array<
    Omit<CheckpointRecord, "weights" | "id"> & { weightPath: string }
  >;
  metrics: Array<Omit<MetricRecord, "id">>;
  blobs: Array<{ key: string; path: string }>;
  version: number;
}

interface JsonBundle {
  run: RunManifest;
  checkpoints: Array<Omit<CheckpointRecord, "weights" | "id"> & { weights: string }>;
  metrics: Array<Omit<MetricRecord, "id" | "runId">>;
  blobs: Array<{ key: string; data: string }>;
  version: number;
}

interface NormalizedBundle {
  run: RunManifest;
  checkpoints: Array<Omit<CheckpointRecord, "id" | "runId">>;
  metrics: Array<Omit<MetricRecord, "id" | "runId">>;
  blobs: Array<{ key: string; data: ArrayBuffer }>;
}

const MANIFEST_FILENAME = "manifest.json";

const randomId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const bufferToBase64 = (buffer: ArrayBuffer) => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(buffer).toString("base64");
  }
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  if (typeof Buffer !== "undefined") {
    const buf = Buffer.from(base64, "base64");
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const sanitizeMetrics = (metrics: MetricRecord[]) =>
  metrics.map(({ id: _discard, ...rest }) => {
    void _discard;
    return rest;
  });

export const exportRunBundle = async (
  runId: string,
  options: ExportOptions = {}
) => {
  const format = options.format ?? "zip";
  const run = await fetchRun(runId);
  if (!run) {
    throw new Error(`Run ${runId} not found`);
  }

  const [checkpoints, metrics, blobs] = await Promise.all([
    fetchCheckpoints(runId),
    fetchMetrics(runId),
    fetchBlobs(runId),
  ]);

  if (format === "json") {
    const payload: JsonBundle = {
      run,
      checkpoints: checkpoints.map((checkpoint) => {
          const { weights, ...rest } = checkpoint;
          return {
            ...rest,
            weights: bufferToBase64(weights),
          };
      }),
      metrics: sanitizeMetrics(metrics),
      blobs: blobs.map((blob) => ({
        key: blob.key,
        data: bufferToBase64(blob.data),
      })),
      version: run.version,
    };
    return new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
  }

  const zip = new JSZip();
  const manifest: ExportManifest = {
    run,
    checkpoints: checkpoints.map((checkpoint) => ({
      runId: checkpoint.runId,
      step: checkpoint.step,
      episode: checkpoint.episode,
      rewardMean: checkpoint.rewardMean,
      label: checkpoint.label,
      createdAt: checkpoint.createdAt,
      pinned: checkpoint.pinned ?? false,
      notes: checkpoint.notes,
      updatedAt: checkpoint.updatedAt ?? checkpoint.createdAt,
      weightPath: `checkpoints/${randomId()}.bin`,
    })),
    metrics: sanitizeMetrics(metrics),
    blobs: blobs.map((blob) => ({
      key: blob.key,
      path: `blobs/${blob.key.replaceAll("/", "_")}.${randomId()}.bin`,
    })),
    version: run.version,
  };

  await Promise.all(
    manifest.checkpoints.map(async (checkpoint, index) => {
      const data = checkpoints[index]?.weights;
      if (data) {
        zip.file(checkpoint.weightPath, data, { binary: true });
      }
    })
  );

  await Promise.all(
    manifest.blobs.map(async (blob, index) => {
      const data = blobs[index]?.data;
      if (data) {
        zip.file(blob.path, data, { binary: true });
      }
    })
  );

  zip.file(MANIFEST_FILENAME, JSON.stringify(manifest, null, 2));
  return zip.generateAsync({ type: "blob" });
};

export const importRunBundle = async (input: File | ArrayBuffer | Blob) => {
  const buffer =
    input instanceof Blob ? await input.arrayBuffer() : input;

  try {
    const zip = await JSZip.loadAsync(buffer);
    return importFromZip(zip);
  } catch (zipError) {
    try {
      const text = new TextDecoder().decode(buffer);
      const json = JSON.parse(text) as JsonBundle;
      return importFromJson(json);
    } catch (jsonError) {
      if (zipError instanceof Error) {
        throw zipError;
      }
      throw jsonError;
    }
  }
};

const importFromZip = async (zip: JSZip) => {
  const manifestEntry = zip.file(MANIFEST_FILENAME);
  if (!manifestEntry) {
    throw new Error("Invalid bundle: missing manifest.json");
  }
  const manifest = JSON.parse(await manifestEntry.async("string")) as ExportManifest;

  const checkpoints = await Promise.all(
    manifest.checkpoints.map(async (checkpoint) => {
      const file = zip.file(checkpoint.weightPath);
      const weights = file ? await file.async("arraybuffer") : new ArrayBuffer(0);
      return {
        step: checkpoint.step,
        episode: checkpoint.episode,
        rewardMean: checkpoint.rewardMean,
        label: checkpoint.label,
        createdAt: checkpoint.createdAt,
        pinned: checkpoint.pinned,
        notes: checkpoint.notes,
        updatedAt: checkpoint.updatedAt,
        weights,
      };
    })
  );

  const blobs = await Promise.all(
    manifest.blobs.map(async (blob) => {
      const file = zip.file(blob.path);
      if (!file) {
        return null;
      }
      const data = await file.async("arraybuffer");
      return { key: blob.key, data };
    })
  );

  const normalized: NormalizedBundle = {
    run: manifest.run,
    checkpoints,
    metrics: manifest.metrics,
    blobs: blobs.filter((blob): blob is { key: string; data: ArrayBuffer } => Boolean(blob)),
  };

  return persistBundle(normalized);
};

const importFromJson = async (bundle: JsonBundle) => {
  const normalized: NormalizedBundle = {
    run: bundle.run,
    checkpoints: bundle.checkpoints.map(({ weights, ...rest }) => ({
      ...rest,
      weights: base64ToArrayBuffer(weights),
    })),
    metrics: bundle.metrics,
    blobs: bundle.blobs.map(({ key, data }) => ({
      key,
      data: base64ToArrayBuffer(data),
    })),
  };
  return persistBundle(normalized);
};

const persistBundle = async (bundle: NormalizedBundle) => {
  const existing = await fetchRun(bundle.run.id);
  const runId = existing?.id === bundle.run.id ? randomId() : bundle.run.id;

  const run: RunManifest = {
    ...bundle.run,
    id: runId,
    createdAt: new Date().toISOString(),
  };

  await createRunManifest(run);

  for (const checkpoint of bundle.checkpoints) {
    const { weights, ...rest } = checkpoint;
    const record: CheckpointRecord = {
      runId,
      weights,
      ...rest,
    };
    await addCheckpoint(record);
  }

  for (const metric of bundle.metrics) {
    const { timestamp, ...rest } = metric;
    const record: MetricRecord = {
      runId,
      ...rest,
      timestamp: timestamp ?? new Date().toISOString(),
    };
    await appendMetric(record);
  }

  for (const blob of bundle.blobs) {
    await storeBlob({
      runId,
      key: blob.key,
      data: blob.data,
    });
  }

  return runId;
};

export const clearRun = async (runId: string) => {
  await deleteRun(runId);
};







