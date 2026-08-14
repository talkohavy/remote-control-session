/**
 * Wayland routes screen capture through the PipeWire portal, which behaves differently
 * enough from X11/macOS/Windows that the capture module has to branch on it.
 */
export function isWayland(): boolean {
  return process.platform === 'linux' && Boolean(process.env['WAYLAND_DISPLAY']);
}
