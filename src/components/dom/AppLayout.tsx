'use client';

import { ReactNode } from 'react';
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
  return (
    <>
      {/* Page content */}
      {children}
      
      {/* Persistent 3D Scene Canvas - always rendered */}
      <Scene />
    </>
  );
}
