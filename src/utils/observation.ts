import type { EnvObservation } from "@/env";

const isFloatArray = (
  observation: EnvObservation
): observation is Float32Array | Float64Array => {
  return (
    observation instanceof Float32Array || observation instanceof Float64Array
  );
};

const isNumberArray = (observation: EnvObservation): observation is number[] => {
  return Array.isArray(observation);
};

const hasBuffer = (
  observation: EnvObservation
): observation is { buffer: Float32Array | number[] } => {
  return typeof observation === "object" && observation !== null && "buffer" in observation;
};

const isNumericArrayLike = (observation: EnvObservation): boolean => {
  return (
    typeof observation === "object" &&
    observation !== null &&
    "length" in observation &&
    typeof (observation as { length: number }).length === "number" &&
    typeof (observation as Record<number, unknown>)[0] === "number"
  );
};

export const toObservationArray = (observation: EnvObservation): Float32Array => {
  if (isFloatArray(observation)) {
    return observation instanceof Float32Array
      ? observation
      : new Float32Array(observation);
  }
  if (isNumberArray(observation)) {
    return new Float32Array(observation);
  }
  if (hasBuffer(observation)) {
    const { buffer } = observation;
    return buffer instanceof Float32Array ? buffer : new Float32Array(buffer);
  }
  if (isNumericArrayLike(observation)) {
    const { length } = observation as { length: number };
    const result = new Float32Array(length);
    for (let i = 0; i < length; i += 1) {
      result[i] = Number((observation as Record<number, number>)[i]);
    }
    return result;
  }
  throw new Error("Unsupported observation format");
};
