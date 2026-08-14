import { useCallback, useEffect, useRef } from 'react';
import { toNormalizedPoint } from './to-normalized-point';
import type { DrawStyle, NormalizedPoint } from '@root/common/types';

type Pixel = { x: number; y: number };

/** TEMP diagnostic flag: disables the local instant-preview paint so only the video's own baked-in ink is visible. */
const DEBUG_DISABLE_LOCAL_PREVIEW = true;

type UseDrawCaptureArgs = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isEnabled: boolean;
  color: string;
  width: number;
  /** Bump this number to wipe the local canvas, e.g. after a "Clear" click. */
  clearSignal: number;
  onDrawStart: (strokeId: string, point: NormalizedPoint, style: DrawStyle) => void;
  onDrawPoint: (strokeId: string, point: NormalizedPoint) => void;
  onDrawEnd: (strokeId: string) => void;
};

/**
 * Captures pointer drags over the video and paints them onto a local canvas immediately,
 * while streaming each point to the host over the wire (see `ViewerSession`). The local
 * paint gives the viewer zero-latency feedback; the host's on-screen overlay - and the
 * viewer's own video feed once the host recaptures its screen - catch up moments later.
 */
export function useDrawCapture(args: UseDrawCaptureArgs) {
  const { videoRef, canvasRef, isEnabled, color, width, clearSignal, onDrawStart, onDrawPoint, onDrawEnd } = args;

  const activeStrokeId = useRef<string | null>(null);
  const lastPixel = useRef<Pixel | null>(null);

  // Keep the canvas' drawing buffer in step with the video's own on-screen size.
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const resize = (): void => {
      const rect = video.getBoundingClientRect();

      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resize();

    const observer = new ResizeObserver(resize);

    observer.observe(video);

    return () => observer.disconnect();
  }, [videoRef, canvasRef]);

  // Deliberately keyed only on `clearSignal` - `canvasRef` is a ref and read fresh regardless.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [clearSignal]);

  /**
   * Reuses `toNormalizedPoint`'s letterboxing math to place the stroke on the canvas
   * exactly where the video itself renders that fraction of the host's screen.
   */
  const toPixel = useCallback(
    (point: NormalizedPoint): Pixel | null => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || !video.videoWidth || !video.videoHeight) return null;

      const rect = video.getBoundingClientRect();
      const scale = Math.min(rect.width / video.videoWidth, rect.height / video.videoHeight);
      const contentWidth = video.videoWidth * scale;
      const contentHeight = video.videoHeight * scale;
      const offsetX = (rect.width - contentWidth) / 2;
      const offsetY = (rect.height - contentHeight) / 2;

      return {
        x: (offsetX + point.x * contentWidth) * (canvas.width / rect.width),
        y: (offsetY + point.y * contentHeight) * (canvas.height / rect.height),
      };
    },
    [videoRef, canvasRef],
  );

  const pointFrom = useCallback(
    (event: React.MouseEvent): NormalizedPoint | null => {
      const video = videoRef.current;

      if (!video) return null;

      return toNormalizedPoint(video, event.clientX, event.clientY);
    },
    [videoRef],
  );

  const paintDot = useCallback(
    (pixel: Pixel): void => {
      if (DEBUG_DISABLE_LOCAL_PREVIEW) return;

      const ctx = canvasRef.current?.getContext('2d');

      if (!ctx) return;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, width / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [canvasRef, color, width],
  );

  const paintSegment = useCallback(
    (from: Pixel, to: Pixel): void => {
      if (DEBUG_DISABLE_LOCAL_PREVIEW) return;

      const ctx = canvasRef.current?.getContext('2d');

      if (!ctx) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    },
    [canvasRef, color, width],
  );

  const endActiveStroke = useCallback((): void => {
    if (!activeStrokeId.current) return;

    onDrawEnd(activeStrokeId.current);
    activeStrokeId.current = null;
    lastPixel.current = null;
  }, [onDrawEnd]);

  const onMouseDown = useCallback(
    (event: React.MouseEvent): void => {
      if (!isEnabled) return;

      event.preventDefault();

      const point = pointFrom(event);
      const pixel = point && toPixel(point);

      if (!point || !pixel) return;

      const strokeId = crypto.randomUUID();

      activeStrokeId.current = strokeId;
      lastPixel.current = pixel;

      // eslint-disable-next-line no-console
      console.log('[viewer] onMouseDown', {
        videoRect: videoRef.current?.getBoundingClientRect(),
        videoIntrinsic: videoRef.current
          ? { videoWidth: videoRef.current.videoWidth, videoHeight: videoRef.current.videoHeight }
          : null,
        normalized: point,
        localPixel: pixel,
      });

      paintDot(pixel);
      onDrawStart(strokeId, point, { color, width });
    },
    [isEnabled, pointFrom, toPixel, paintDot, onDrawStart, color, width],
  );

  const onMouseMove = useCallback(
    (event: React.MouseEvent): void => {
      if (!isEnabled || !activeStrokeId.current) return;

      const point = pointFrom(event);
      const pixel = point && toPixel(point);

      if (!point || !pixel) return;

      if (lastPixel.current) paintSegment(lastPixel.current, pixel);

      lastPixel.current = pixel;
      onDrawPoint(activeStrokeId.current, point);
    },
    [isEnabled, pointFrom, toPixel, paintSegment, onDrawPoint],
  );

  const onMouseUp = useCallback(
    (event: React.MouseEvent): void => {
      if (!isEnabled) return;

      event.preventDefault();
      endActiveStroke();
    },
    [isEnabled, endActiveStroke],
  );

  // Dragging the pointer off the video must not leave a stroke open forever.
  const onMouseLeave = useCallback((): void => {
    if (isEnabled) endActiveStroke();
  }, [isEnabled, endActiveStroke]);

  return { onMouseDown, onMouseMove, onMouseUp, onMouseLeave };
}
