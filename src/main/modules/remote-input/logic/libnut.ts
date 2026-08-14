import type * as LibnutModule from '@nut-tree-fork/libnut-darwin';

export type Libnut = typeof LibnutModule;

/**
 * The three platform packages are interface-identical, so the darwin one supplies the types
 * for all of them.
 */
const MODULE_BY_PLATFORM: Record<string, string> = {
  win32: '@nut-tree-fork/libnut-win32',
  linux: '@nut-tree-fork/libnut-linux',
  darwin: '@nut-tree-fork/libnut-darwin',
};

let cached: Libnut | null | undefined;

/**
 * Binds the prebuilt native module for the current platform.
 *
 * We deliberately do NOT use the `@nut-tree-fork/libnut` wrapper: it pulls in
 * `@nut-tree-fork/shared`, which its own manifest lists only as a devDependency, so
 * requiring it throws at runtime.
 *
 * Loading is lazy and failure is non-fatal - a machine can legitimately be able to share its
 * screen while being unable to inject input (see Wayland).
 */
export function loadLibnut(): Libnut | null {
  if (cached !== undefined) return cached;

  const moduleName = MODULE_BY_PLATFORM[process.platform] ?? MODULE_BY_PLATFORM['darwin']!;

  try {
    /**
     * A synchronous, per-platform require. A static import cannot be conditional, so
     * bundling one would force all three binaries to be resolved on every platform.
     */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require(moduleName) as Libnut;
  } catch (error) {
    console.error('[remote-input] native input module unavailable:', error);
    cached = null;
  }

  return cached;
}
