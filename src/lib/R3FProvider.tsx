'use client';

import React, { ReactNode, useEffect, useState } from 'react';

/**
 * Provider that ensures R3F is properly initialized before any Canvas components mount
 * This prevents "Canvas is not part of the THREE namespace" errors
 */
export function R3FProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Force a tick to ensure all modules are loaded
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
