/**
 * ONNX Runtime Web inference wrapper for PPO policy
 */
import { InferenceSession, Tensor } from 'onnxruntime-web';
import { Observation, Action, InferenceResult } from './types';

let inferenceSession: InferenceSession | null = null;

/**
 * Initialize the ONNX inference session
 * Load the policy model from public/models/policy.onnx
 */
export async function initializeSession(): Promise<InferenceSession> {
  if (inferenceSession) {
    return inferenceSession;
  }

  try {
    inferenceSession = await InferenceSession.create('/models/policy.onnx');
    console.log('ONNX Session initialized successfully');
    return inferenceSession;
  } catch (error) {
    console.error('Failed to initialize ONNX session:', error);
    throw error;
  }
}

/**
 * Get or initialize the session
 */
export function getSession(): InferenceSession | null {
  return inferenceSession;
}

/**
 * Build observation vector from agent state
 * Level 1: [agent_x, agent_y, goal_x, goal_y, dist_to_goal]
 * Level 2: add vision rays
 */
export function buildObservation(obs: Observation): Float32Array {
  const dx = obs.goalX - obs.agentX;
  const dy = obs.goalY - obs.agentY;
  const distToGoal = Math.sqrt(dx * dx + dy * dy);

  const baseObs = [obs.agentX, obs.agentY, obs.goalX, obs.goalY, distToGoal];

  // Add vision rays if available (Level 2)
  if (obs.visionRays && obs.visionRays.length > 0) {
    return new Float32Array([...baseObs, ...obs.visionRays]);
  }

  return new Float32Array(baseObs);
}

/**
 * Run inference on observation
 * Returns action (0-3) and logits for debugging
 */
export async function runInference(observation: Observation): Promise<InferenceResult> {
  const session = getSession();
  if (!session) {
    throw new Error('Inference session not initialized');
  }

  try {
    const obsArray = buildObservation(observation);
    
    // Create input tensor
    // Shape depends on the policy: typically [1, feature_size] for single agent
    // Adjust based on your actual model input shape
    const inputTensor = new Tensor('float32', obsArray, [1, obsArray.length]);

    // Run inference
    // Assume the model has 'input' as input name and 'output' for logits
    const feeds = {
      input: inputTensor,
    };

    const results = await session.run(feeds);

    // Extract logits from output
    // Adjust output name and shape based on your model
    const outputTensor = results.output as Tensor;
    const logits = Array.from(outputTensor.data as Float32Array);

    // Argmax to get action
    const action = logits.indexOf(Math.max(...logits));

    inputTensor.dispose();

    return {
      action: (action % 4) as Action, // Clamp to valid action range
      logits,
    };
  } catch (error) {
    console.error('Inference failed:', error);
    throw error;
  }
}

/**
 * Batch inference for multiple agents
 * More efficient than running inference sequentially
 */
export async function runBatchInference(
  observations: Observation[]
): Promise<InferenceResult[]> {
  const session = getSession();
  if (!session) {
    throw new Error('Inference session not initialized');
  }

  try {
    // Build batch
    const allObs = observations.map((obs) => buildObservation(obs));
    const batchSize = observations.length;
    const featureSize = allObs[0].length;

    // Concatenate into flat array for batch tensor
    const batchArray = new Float32Array(batchSize * featureSize);
    allObs.forEach((obs, i) => {
      batchArray.set(obs, i * featureSize);
    });

    const inputTensor = new Tensor('float32', batchArray, [batchSize, featureSize]);

    const feeds = {
      input: inputTensor,
    };

    const results = await session.run(feeds);
    const outputTensor = results.output as Tensor;
    const allLogits = outputTensor.data as Float32Array;

    // Parse results
    const inferenceResults: InferenceResult[] = [];
    for (let i = 0; i < batchSize; i++) {
      const logits = Array.from(allLogits.slice(i * 4, (i + 1) * 4));
      const action = logits.indexOf(Math.max(...logits));
      inferenceResults.push({
        action: (action % 4) as Action,
        logits,
      });
    }

    inputTensor.dispose();

    return inferenceResults;
  } catch (error) {
    console.error('Batch inference failed:', error);
    throw error;
  }
}
