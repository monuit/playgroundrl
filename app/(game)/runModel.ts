import type { InferenceSession } from 'onnxruntime-web'

const MAX_ABS_VALUE = 1_000

const sanitizeScalar = (value: number, fallback = 0) => {
  if (!Number.isFinite(value)) {
    return fallback
  }
  if (value > MAX_ABS_VALUE) return MAX_ABS_VALUE
  if (value < -MAX_ABS_VALUE) return -MAX_ABS_VALUE
  return value
}

// Track outputs we already warned about to avoid spamming the console.
const warnedBigIntOutputs = new Set<string>()
const warnedNonFiniteOutputs = new Set<string>()

const assertFiniteTensor = (name: string, data: ArrayLike<unknown>) => {
  for (let i = 0; i < data.length; i += 1) {
    const value = (data as any)[i]
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        if (process.env.NODE_ENV !== 'production' && !warnedNonFiniteOutputs.has(name)) {
          console.error(`[${name}] non-finite number at index ${i}:`, value)
          warnedNonFiniteOutputs.add(name)
        }
        return false
      }
    } else if (typeof value === 'bigint') {
      // BigInt outputs are integers by definition — treat them as valid numeric outputs here.
      // Warn in development if they are outside JS safe integer range (they will be coerced later).
      if (process.env.NODE_ENV !== 'production') {
        const exceedsSafe = value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)
        if (exceedsSafe && !warnedBigIntOutputs.has(name)) {
          console.warn(`[${name}] BigInt output at index ${i} exceeds JS safe integer range and will be coerced:`, value)
          warnedBigIntOutputs.add(name)
        }
      }
    } else {
      if (process.env.NODE_ENV !== 'production' && !warnedNonFiniteOutputs.has(name)) {
        console.error(`[${name}] non-numeric value at index ${i}:`, value)
        warnedNonFiniteOutputs.add(name)
      }
      return false
    }
  }
  return true
}

const coerceTensorValueToNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.max(-MAX_ABS_VALUE, Math.min(MAX_ABS_VALUE, value)) : fallback
  if (typeof value === 'bigint') {
    const asNum = Number(value)
    if (!Number.isFinite(asNum)) return fallback
    if (!Number.isSafeInteger(asNum)) return asNum > 0 ? MAX_ABS_VALUE : -MAX_ABS_VALUE
    return Math.max(-MAX_ABS_VALUE, Math.min(MAX_ABS_VALUE, asNum))
  }
  if (typeof value === 'boolean') return value ? 1 : 0
  const coerced = Number(value as any)
  return Number.isFinite(coerced) ? Math.max(-MAX_ABS_VALUE, Math.min(MAX_ABS_VALUE, coerced)) : fallback
}

let ortPromise: Promise<typeof import('onnxruntime-web')> | null = null

const ensureOrt = async () => {
  if (!ortPromise) {
    ortPromise = import('onnxruntime-web').then((module) => {
      // Keep single-threaded by default; the threaded artifacts will still be copied into
      // public/model so the runtime can pick them up if the environment supports it.
      module.env.wasm.numThreads = 1

      const existingPaths =
        typeof module.env.wasm.wasmPaths === 'object' && module.env.wasm.wasmPaths ? module.env.wasm.wasmPaths : undefined

      module.env.wasm.wasmPaths = {
        ...(existingPaths ?? {}),
        'ort-wasm-simd.wasm': '/model/ort-wasm-simd.wasm',
        'ort-wasm.wasm': '/model/ort-wasm.wasm',
        // Map threaded names to the canonical copies we place in public/model during the Next build
        'ort-wasm-simd-threaded.wasm': '/model/ort-wasm-simd.wasm',
        'ort-wasm-threaded.wasm': '/model/ort-wasm.wasm',
        'ort-wasm-simd-threaded.jsep.wasm': '/model/ort-wasm-simd.jsep.wasm',
        'ort-wasm-threaded.jsep.wasm': '/model/ort-wasm.jsep.wasm',
      } as any

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
  return ort.InferenceSession.create(model, { executionProviders: ['wasm'] })
}

export async function warmupModel(model: InferenceSession, inputSize: number) {
  if (!model || inputSize <= 0) return
  const ort: any = await ensureOrt()
  const warmupTensor = new ort.Tensor('float32', new Float32Array(inputSize), [1, inputSize])
  warmupTensor.data.fill(0)
  try {
    const feeds: Record<string, any> = { [model.inputNames[0]]: warmupTensor }
    await model.run(feeds)
  } catch (error) {
    console.error('Warmup failed', error)
  }
}

export async function runModel(model: InferenceSession, input: number[][], inputSize: number) {
  if (!model || inputSize <= 0 || input.length === 0) {
    return [[], 0]
  }

  const ort: any = await ensureOrt()
  const tensor = new ort.Tensor('float32', new Float32Array(inputSize), [1, inputSize])
  const feeds: Record<string, any> = { [model.inputNames[0]]: tensor }

  const outputName = model.outputNames[0]
  const outputs: number[] = []
  let totalTime = 0

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

  // Persistent per-function warning sets (stored on the function object) to avoid log spam.
  const warnedBigInt = (runModel as any).__warnedBigIntOutputs ?? ((runModel as any).__warnedBigIntOutputs = new Set<string>())
  const warnedNonFinite = (runModel as any).__warnedNonFiniteOutputs ?? ((runModel as any).__warnedNonFiniteOutputs = new Set<string>())

  for (const singleInput of input) {
    let clampedInput = false
    for (let i = 0; i < inputSize; i += 1) {
      const nextValue = sanitizeScalar(singleInput[i] ?? 0)
      if (!Number.isFinite(singleInput[i]) || nextValue !== singleInput[i]) clampedInput = true
      tensor.data[i] = nextValue
    }
    if (clampedInput && process.env.NODE_ENV !== 'production') {
      console.warn('[runModel] Sanitized non-finite or out-of-range model input.', singleInput)
    }

    try {
      const start = now()
      const outputData: Record<string, any> = await model.run(feeds)
      totalTime += now() - start

      const tensorOutput = outputData[outputName]
      const tensorData = tensorOutput?.data as ArrayLike<unknown> | undefined

      if (!tensorData || tensorData.length === 0) {
        outputs.push(0)
        continue
      }

      if (!assertFiniteTensor(outputName, tensorData) && process.env.NODE_ENV !== 'production') {
        if (!warnedNonFinite.has(outputName)) {
          console.warn('[runModel] Output tensor contained non-finite values. Applying sanitization.')
          warnedNonFinite.add(outputName)
        }
      }

      const rawValue = (tensorData as any)[0] ?? 0
      // Coerce bigint/typed-array values to a safe JS number before sanitization
      const rawNumber = coerceTensorValueToNumber(rawValue, 0)
      if (typeof rawValue === 'bigint' && process.env.NODE_ENV !== 'production') {
        if (!warnedBigInt.has(outputName)) {
          console.warn('[runModel] Output tensor contains integer (BigInt) values; coercing first element to Number:', rawValue)
          warnedBigInt.add(outputName)
        }
      }

      const sanitized = sanitizeScalar(rawNumber)
      outputs.push(sanitized)
    } catch (error) {
      console.error('Inference failed', error)
      throw error
    }
  }

  return [outputs, totalTime / input.length]
}