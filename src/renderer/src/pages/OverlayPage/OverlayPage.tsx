import { useEffect, useRef } from 'react';
import { useIpcIncomingEvent } from '@renderer/hooks/useIpcIncomingEvent';
import { ipcClient } from '@renderer/lib/ipc';
import { useOverlayCanvas } from './logic/useOverlayCanvas';
import type {
  AnnotationStrokeEndPayload,
  AnnotationStrokePointPayload,
  AnnotationStrokeStartPayload,
} from '@root/common/types';

/**
 * What the host actually sees: a full-viewport, click-through, transparent canvas
 * rendered inside its own dedicated `BrowserWindow` (see `AnnotationOverlayService`),
 * painted with strokes pushed from main as a viewer draws.
 *
 * This page intentionally renders outside the normal `Layout` (see `App.tsx`) - no
 * header, sidebar or toaster, which would otherwise paint opaque pixels over the host's
 * desktop.
 */
export default function OverlayPage(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { startStroke, extendStroke, endStroke, clear, setDisplayOffset } = useOverlayCanvas(canvasRef);

  /**
   * The shared `index.html`/`DarkThemeProvider` are built for the normal app window: a
   * solid title bar div sits outside the React root, and `body` always gets an opaque
   * `background: var(--color-background)` from the current theme (near-black in dark
   * mode). On a transparent `BrowserWindow` sized to the whole display, that opaque
   * paint becomes a full-screen veil blocking everything underneath it - inline styles
   * beat the theme's CSS class regardless of which theme is active, so this must run on
   * every mount, not just once opportunistically.
   */
  useEffect(() => {
    document.getElementById('title-bar')?.style.setProperty('display', 'none');
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    document.getElementById('root')?.style.setProperty('background', 'transparent');
  }, []);

  // See `AnnotationOverlayService.getDisplayOffset` for why this is pulled, not pushed.
  useEffect(() => {
    ipcClient.annotation.getDisplayOffset().then(setDisplayOffset);
  }, [setDisplayOffset]);

  useIpcIncomingEvent(ipcClient.annotation.onStrokeStart, (payload: AnnotationStrokeStartPayload) =>
    startStroke(payload),
  );
  useIpcIncomingEvent(ipcClient.annotation.onStrokePoint, (payload: AnnotationStrokePointPayload) =>
    extendStroke(payload),
  );
  useIpcIncomingEvent(ipcClient.annotation.onStrokeEnd, (payload: AnnotationStrokeEndPayload) => endStroke(payload));
  useIpcIncomingEvent(ipcClient.annotation.onClear, () => clear());

  return <canvas ref={canvasRef} className='fixed inset-0 size-full' />;
}
