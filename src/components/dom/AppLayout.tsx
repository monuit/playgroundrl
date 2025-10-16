'use client';

import { ReactNode, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Scene to avoid SSR issues
const Scene = dynamic(() => import('@/components/canvas/Scene'), { ssr: false });

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * Application layout wrapper that manages the persistent 3D scene
 * This component ensures the Canvas is always mounted and ready to receive
 * 3D content from anywhere in the application via the r3f portal
 */
export function AppLayout({ children }: AppLayoutProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="relative w-full h-full overflow-hidden"
    >
      {/* Page content */}
      {children}
      
      {/* Persistent 3D Scene Canvas - always rendered */}
      <Scene
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: -1,
        }}
        eventSource={ref}
        eventPrefix="client"
      />
    </div>
  );
}
