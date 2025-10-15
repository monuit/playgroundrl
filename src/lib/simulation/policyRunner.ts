import type { InferenceSession } from "onnxruntime-web";
import { Tensor } from "onnxruntime-web";

interface LoadOptions {
  executionProviders?: InferenceSession.SessionOptions["executionProviders"];
}

const DEFAULT_PROVIDERS: InferenceSession.SessionOptions["executionProviders"] = [
  "wasm",
  "webgl",
];

export class PolicyRunner {
  private session: InferenceSession | null = null;
  private inputName: string | null = null;
  private outputName: string | null = null;
  private inputDims: number[] = [];
  private dynamicBatch = false;
  private inputSize = 0;

  async loadFromUrl(url: string, options?: LoadOptions) {
    const { InferenceSession } = await import("onnxruntime-web");
    this.session = await InferenceSession.create(url, {
      executionProviders: options?.executionProviders ?? DEFAULT_PROVIDERS,
    });
    this.captureMetadata();
  }

  async loadFromArrayBuffer(buffer: ArrayBuffer, options?: LoadOptions) {
    const model = new Uint8Array(buffer);
    const { InferenceSession } = await import("onnxruntime-web");
    this.session = await InferenceSession.create(model, {
      executionProviders: options?.executionProviders ?? DEFAULT_PROVIDERS,
    });
    this.captureMetadata();
  }

  clear() {
    this.session = null;
    this.inputName = null;
    this.outputName = null;
    this.inputDims = [];
    this.dynamicBatch = false;
    this.inputSize = 0;
  }

  isReady() {
    return Boolean(this.session) && Boolean(this.inputName);
  }

  async actBatch(observations: Float32Array[]) {
    if (!this.session || !this.inputName) {
      throw new Error("Policy not loaded");
    }
    if (observations.length === 0) {
      return [] as number[];
    }

    const featureLength = observations[0].length;
    if (featureLength === 0) {
      return observations.map(() => 0);
    }

    const batch = observations.length;
    const data = new Float32Array(batch * featureLength);
    for (let i = 0; i < observations.length; i += 1) {
      data.set(observations[i], i * featureLength);
    }

    const tensor = this.buildTensor(data, batch, featureLength);
    const feeds: Record<string, Tensor> = {
      [this.inputName]: tensor,
    };

    const results = await this.session.run(feeds);
    const candidate = this.outputName ? results[this.outputName] : Object.values(results)[0];
    if (!candidate) {
      throw new Error("Policy produced no output");
    }
    if (!(candidate instanceof Tensor)) {
      throw new Error("Policy output is not a tensor");
    }
    const outputData = this.asFloatArray(candidate);
    const dims = candidate.dims?.length ? candidate.dims.slice() : [outputData.length];
    const actionCount = this.resolveActionCount(dims, batch, outputData.length);

    const actions: number[] = [];
    for (let i = 0; i < batch; i += 1) {
      let bestIndex = 0;
      let bestValue = Number.NEGATIVE_INFINITY;
      for (let j = 0; j < actionCount; j += 1) {
        const value = outputData[i * actionCount + j];
        if (value > bestValue) {
          bestValue = value;
          bestIndex = j;
        }
      }
      actions.push(bestIndex);
    }
    return actions;
  }

  private buildTensor(data: Float32Array, batch: number, featureLength: number) {
    if (this.inputDims.length === 0) {
      return new Tensor("float32", data, [batch, featureLength]);
    }
    const dims = this.inputDims.slice();
    if (dims[0] <= 0 || this.dynamicBatch) {
      dims[0] = batch;
    }

    const declaredSize = dims.reduce((acc, dim) => acc * (dim <= 0 ? 1 : dim), 1);
    if (declaredSize !== data.length) {
      return new Tensor("float32", data, [batch, featureLength]);
    }

    return new Tensor("float32", data, dims);
  }

  private resolveActionCount(dims: number[], batch: number, total: number) {
    if (dims.length >= 2) {
      const last = dims.at(-1) ?? total;
      return Math.max(1, last);
    }
    const candidate = total / batch;
    if (!Number.isFinite(candidate) || candidate <= 0) {
      return total;
    }
    return candidate;
  }

  private asFloatArray(tensor: Tensor) {
    const { data } = tensor;
    if (data instanceof Float32Array) {
      return data;
    }
    if (data instanceof Float64Array) {
      return new Float32Array(data);
    }
    if (data instanceof Int32Array || data instanceof Uint8Array || data instanceof Uint16Array || data instanceof Uint32Array) {
      return new Float32Array(data as ArrayLike<number>);
    }
    if (Array.isArray(data)) {
      return Float32Array.from(data.map((value) => Number(value) || 0));
    }
    return Float32Array.from([]);
  }

  private captureMetadata() {
    if (!this.session) {
      return;
    }
    this.inputName = this.session.inputNames[0] ?? null;
    this.outputName = this.session.outputNames[0] ?? null;
    if (!this.inputName) {
      return;
    }
  const metadataMap = this.session.inputMetadata as unknown as Record<string, { dimensions?: readonly number[] }>;
    const metadata = metadataMap?.[this.inputName];
    const dims = metadata?.dimensions ?? [];
    this.inputDims = dims.map((dim: number) => (typeof dim === "number" ? dim : 1));
    this.dynamicBatch = this.inputDims[0] <= 0;
    const product = this.inputDims
      .slice(1)
      .reduce((acc, dim) => acc * (dim <= 0 ? 1 : dim), 1);
    this.inputSize = product;
    if (!this.outputName) {
      const names = this.session.outputNames;
      this.outputName = names.length > 0 ? names[0] : null;
    }
  }
}
