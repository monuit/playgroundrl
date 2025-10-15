import type { EnvObservation } from "@/env";

export type BackendType = "tfjs" | "pyodide";

export interface TrainHyperParams {
  learningRate: number;
  gamma: number;
  entropyCoeff?: number;
  clipRange?: number;
  targetUpdateFrequency?: number;
  batchSize?: number;
}

export interface AlgorithmInit {
  obsShape: readonly number[];
  actionSize: number;
  backend: BackendType;
  seed: string;
}

export interface TrainBatch {
  observations: Float32Array;
  actions: Float32Array;
  rewards: Float32Array;
  nextObservations: Float32Array;
  dones: Uint8Array;
  extras?: Record<string, Float32Array | Uint8Array>;
}

export interface AlgorithmDiagnostics {
  loss?: number;
  entropy?: number;
  learningRate?: number;
  approxKL?: number;
  clipFraction?: number;
  explainedVariance?: number;
}

export interface Algorithm<THyper extends TrainHyperParams = TrainHyperParams> {
  readonly id: string;
  readonly backend: BackendType;
  readonly hyper: THyper;
  init(config: AlgorithmInit): Promise<void>;
  act(observation: EnvObservation): Promise<number | number[]>;
  getActionMetadata?(): ActionMetadata | undefined;
  observe(batch: TrainBatch): Promise<void>;
  getDiagnostics?(): AlgorithmDiagnostics | undefined;
  save(): Promise<ArrayBuffer>;
  load(buffer: ArrayBuffer): Promise<void>;
  dispose(): Promise<void>;
}

export interface ActionMetadata {
  logProb?: number;
  valueEstimate?: number | number[];
  distributionParams?: Record<string, number | number[]>;
}
