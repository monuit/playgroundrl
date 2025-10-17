import type { InferenceSession } from 'onnxruntime-web'

const MAX_ABS_VALUE = 1_000;

const sanitizeScalar = (value: number, fallback = 0) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  if (value > MAX_ABS_VALUE) {
    return MAX_ABS_VALUE;
  }
  if (value < -MAX_ABS_VALUE) {
    return -MAX_ABS_VALUE;
  }
  return value;
};

const assertFiniteTensor = (name: string, data: ArrayLike<number>) => {
  for (let i = 0; i < data.length; i += 1) {
    const value = data[i];
    if (!Number.isFinite(value)) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[${name}] non-finite value at index ${i}:`, value);
      }
      return false;
    }
  }
  return true;
};

let ortPromise: Promise<typeof import('onnxruntime-web')> | null = null

const ensureOrt = async () => {
  if (!ortPromise) {
    ortPromise = import('onnxruntime-web').then((module) => {
      module.env.wasm.numThreads = 1
      const existingPaths =
        typeof module.env.wasm.wasmPaths === 'object' && module.env.wasm.wasmPaths
          ? module.env.wasm.wasmPaths
          : undefined

      module.env.wasm.wasmPaths = {
        ...(existingPaths ?? {}),
        'ort-wasm-simd.wasm': '/model/ort-wasm-simd.wasm',
        'ort-wasm.wasm': '/model/ort-wasm.wasm',
      }
      return module
    })
  }

  return ortPromise
}

export async function createModelGpu(model: ArrayBuffer): Promise<InferenceSession> {
  const ort = await ensureOrt()
  return ort.InferenceSession.create(model, { executionProviders: ['webgl'] })
}

export async function createModelCpu(model: ArrayBuffer): Promise<InferenceSession> {
  const ort = await ensureOrt()
  return ort.InferenceSession.create(model, {
    executionProviders: ['wasm'],
  })
}

export async function warmupModel(model: InferenceSession, inputSize: number) {
  if (!model || inputSize <= 0) return

  const ort = await ensureOrt()
  const warmupTensor = new ort.Tensor('float32', new Float32Array(inputSize), [1, inputSize])
  warmupTensor.data.fill(0)

  try {
    const feeds: Record<string, typeof warmupTensor> = {
      [model.inputNames[0]]: warmupTensor,
    }
    await model.run(feeds)
  } catch (error) {
    console.error('Warmup failed', error)
  }
}

export async function runModel(model: InferenceSession, input: number[][], inputSize: number) {
  if (!model || inputSize <= 0 || input.length === 0) {
    return [[], 0]
  }

  const ort = await ensureOrt()
  const tensor = new ort.Tensor('float32', new Float32Array(inputSize), [1, inputSize])
  const feeds: Record<string, typeof tensor> = {
    [model.inputNames[0]]: tensor,
  }

  const outputName = model.outputNames[0]
  const outputs: number[] = []
  let totalTime = 0

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

  for (const singleInput of input) {
    let clampedInput = false
    for (let i = 0; i < inputSize; i += 1) {
      const nextValue = sanitizeScalar(singleInput[i] ?? 0)
      if (!Number.isFinite(singleInput[i]) || nextValue !== singleInput[i]) {
        clampedInput = true
      }
      tensor.data[i] = nextValue
    }
    if (clampedInput && process.env.NODE_ENV !== 'production') {
      console.warn('[runModel] Sanitized non-finite or out-of-range model input.', singleInput)
    }

    try {
      const start = now()
      const outputData = await model.run(feeds)
      totalTime += now() - start

      const tensorOutput = outputData[outputName]
      const tensorData = tensorOutput?.data as ArrayLike<number> | undefined

      if (!tensorData || tensorData.length === 0) {
        outputs.push(0)
        continue
      }

      if (!assertFiniteTensor(outputName, tensorData) && process.env.NODE_ENV !== 'production') {
        console.warn('[runModel] Output tensor contained non-finite values. Applying sanitization.')
      }

      const rawValue = tensorData[0] ?? 0
      const sanitized = sanitizeScalar(rawValue)
      outputs.push(sanitized)
    } catch (error) {
      console.error('Inference failed', error)
      throw error
    }
  }

  return [outputs, totalTime / input.length]
}
