import type { NormalizedPoint } from '@root/common/types';

/**
 * Converts a pointer position over the video element into a 0..1 fraction of the remote
 * screen.
 *
 * The subtlety is letterboxing. The element is sized by the layout, but the video inside it
 * keeps the host's aspect ratio, so there are usually blank bars on two sides. Measuring
 * against the element's own rect would skew every coordinate by the size of those bars -
 * the cursor would drift further off the further you moved from the centre.
 *
 * Returns null for positions in the bars, which map to no pixel on the host.
 */
export function toNormalizedPoint(video: HTMLVideoElement, clientX: number, clientY: number): NormalizedPoint | null {
  const { videoWidth, videoHeight } = video;

  if (!videoWidth || !videoHeight) return null;

  const rect = video.getBoundingClientRect();

  // `object-contain`: the video scales by whichever axis runs out of room first.
  const scale = Math.min(rect.width / videoWidth, rect.height / videoHeight);

  const contentWidth = videoWidth * scale;
  const contentHeight = videoHeight * scale;

  const offsetX = (rect.width - contentWidth) / 2;
  const offsetY = (rect.height - contentHeight) / 2;

  const x = (clientX - rect.left - offsetX) / contentWidth;
  const y = (clientY - rect.top - offsetY) / contentHeight;

  if (x < 0 || x > 1 || y < 0 || y > 1) return null;

  return { x, y };
}

const MOUSE_BUTTONS = ['left', 'middle', 'right'] as const;

export function toMouseButton(button: number): 'left' | 'middle' | 'right' | null {
  return MOUSE_BUTTONS[button] ?? null;
}

/**
 * Browser wheel deltas are pixels (roughly 100 per notch); the native backend counts
 * scroll clicks, and its Y axis points the opposite way.
 */
export function toScrollDelta(delta: number): number {
  if (delta === 0) return 0;

  const clicks = Math.round(delta / 100);

  return clicks === 0 ? Math.sign(delta) : clicks;
}
