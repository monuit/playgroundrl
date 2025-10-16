'use client';

import React from 'react';
import { extend, Canvas as R3FCanvas } from '@react-three/fiber';
import type { CanvasProps } from '@react-three/fiber';
import * as THREE from 'three';

// Extend THREE into R3F
type ExtendableCatalogue = Parameters<typeof extend>[0];
extend(THREE as unknown as ExtendableCatalogue);

/**
 * Proxy Canvas component that ensures THREE is properly extended
 * This works around the "Canvas is not part of the THREE namespace" error
 */
export function Canvas(props: CanvasProps) {
  return <R3FCanvas {...props} />;
}
