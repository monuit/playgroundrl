import tunnel from 'tunnel-rat';

/**
 * Global tunnel for portaling React Three Fiber content
 * This allows 3D content to be defined anywhere in the React tree
 * but rendered inside a single persistent Canvas
 */
export const r3f = tunnel();
