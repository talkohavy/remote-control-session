import { useCallback, useEffect, useRef } from 'react';
import type {
  AnnotationStrokeEndPayload,
  AnnotationStrokePointPayload,
  AnnotationStrokeStartPayload,
  DisplayOffset,
  DrawStyle,
} from '@root/common/types';

type ActiveStroke = {
  style: DrawStyle;
  lastX: number;
  lastY: number;
};

/**
 * Owns the overlay's canvas: sizes it to the window, converts the normalised 0..1
 * points carried over the wire into pixels, and paints each segment as it arrives.
 *
 * Strokes are painted directly and permanently onto the canvas rather than kept as
 * replayable point lists - the overlay window is recreated for every new sharing
 * session, so there is nothing to redraw across.
 */
export function useOverlayCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const strokesRef = useRef<Map<string, ActiveStroke>>(new Map());

  /**
   * How far this window's actual top-left sits from the target display's top-left - see
   * `DisplayOffset`. Zero until `AnnotationOverlayService` reports otherwise (e.g. on
   * platforms where the window lands exactly where asked).
   */
  const displayOffsetRef = useRef<DisplayOffset>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const resize = (): void => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, [canvasRef]);

  const setDisplayOffset = useCallback((offset: DisplayOffset): void => {
    displayOffsetRef.current = offset;
  }, []);

  const toPixels = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      const canvas = canvasRef.current;

      if (!canvas) return { x: 0, y: 0 };

      const offset = displayOffsetRef.current;

      return { x: x * canvas.width - offset.x, y: y * canvas.height - offset.y };
    },
    [canvasRef],
  );

  const startStroke = useCallback(
    (payload: AnnotationStrokeStartPayload): void => {
      const ctx = canvasRef.current?.getContext('2d');

      if (!ctx) return;

      const { x, y } = toPixels(payload.x, payload.y);

      strokesRef.current.set(payload.strokeId, { style: payload.style, lastX: x, lastY: y });

      // A dot so a click without dragging still leaves a visible mark.
      ctx.fillStyle = payload.style.color;
      ctx.beginPath();
      ctx.arc(x, y, payload.style.width / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [canvasRef, toPixels],
  );

  const extendStroke = useCallback(
    (payload: AnnotationStrokePointPayload): void => {
      const ctx = canvasRef.current?.getContext('2d');
      const stroke = strokesRef.current.get(payload.strokeId);

      if (!ctx || !stroke) return;

      const { x, y } = toPixels(payload.x, payload.y);

      ctx.strokeStyle = stroke.style.color;
      ctx.lineWidth = stroke.style.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.lastX, stroke.lastY);
      ctx.lineTo(x, y);
      ctx.stroke();

      stroke.lastX = x;
      stroke.lastY = y;
    },
    [canvasRef, toPixels],
  );

  const endStroke = useCallback((payload: AnnotationStrokeEndPayload): void => {
    strokesRef.current.delete(payload.strokeId);
  }, []);

  const clear = useCallback((): void => {
    strokesRef.current.clear();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [canvasRef]);

  return { startStroke, extendStroke, endStroke, clear, setDisplayOffset };
}
