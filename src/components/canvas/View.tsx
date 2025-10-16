'use client';

import { r3f } from '@/lib/scene-portal';
import { forwardRef, ReactNode, Suspense, useImperativeHandle, useRef } from 'react';
import { OrbitControls, PerspectiveCamera, View as ViewDrei } from '@react-three/drei';
import { Vector3 } from 'three';

export const Common = ({
  color,
  camera = { position: new Vector3(0, 0, 6) },
}: {
  color?: string;
  camera?: { position: Vector3 };
}) => (
  <Suspense fallback={null}>
    {color && <color attach="background" args={[color]} />}
    <ambientLight intensity={0.5} />
    <pointLight position={[20, 30, 10]} intensity={1} decay={0.2} />
    <PerspectiveCamera makeDefault fov={40} position={camera.position} />
  </Suspense>
);

type ViewProps = {
  children?: ReactNode;
  orbit?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * View component that portals its 3D content into the persistent Canvas
 * This allows you to define 3D scenes anywhere in your React component tree
 * while rendering them in the single global Canvas
 */
const View = forwardRef<HTMLDivElement, ViewProps>(({ children, orbit, ...props }, ref) => {
  const localRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

  return (
    <>
      {/* This div tracks where the 3D content should render */}
      <div ref={localRef} {...props} />
      {/* Portal the 3D content into the Canvas */}
      <r3f.In>
        <ViewDrei track={localRef as React.RefObject<HTMLElement>}>
          {children}
          {orbit && <OrbitControls />}
        </ViewDrei>
      </r3f.In>
    </>
  );
});

View.displayName = 'View';

export { View };
