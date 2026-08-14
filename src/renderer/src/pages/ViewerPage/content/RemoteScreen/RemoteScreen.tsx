import { useRef } from 'react';
import clsx from 'clsx';
import { useDrawCapture } from '../../logic/useDrawCapture';
import { useInputCapture } from '../../logic/useInputCapture';
import type { DrawStyle, NormalizedPoint, RemoteInputEvent } from '@root/common/types';

type RemoteScreenProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hasStream: boolean;
  isControlling: boolean;
  onInput: (event: RemoteInputEvent) => void;
  isDrawing: boolean;
  drawColor: string;
  drawWidth: number;
  clearSignal: number;
  onDrawStart: (strokeId: string, point: NormalizedPoint, style: DrawStyle) => void;
  onDrawPoint: (strokeId: string, point: NormalizedPoint) => void;
  onDrawEnd: (strokeId: string) => void;
};

export default function RemoteScreen(props: RemoteScreenProps): React.JSX.Element {
  const {
    videoRef,
    hasStream,
    isControlling,
    onInput,
    isDrawing,
    drawColor,
    drawWidth,
    clearSignal,
    onDrawStart,
    onDrawPoint,
    onDrawEnd,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const controlHandlers = useInputCapture({ videoRef, isEnabled: isControlling, onInput });

  const drawHandlers = useDrawCapture({
    videoRef,
    canvasRef,
    isEnabled: isDrawing,
    color: drawColor,
    width: drawWidth,
    clearSignal,
    onDrawStart,
    onDrawPoint,
    onDrawEnd,
  });

  return (
    <div
      className={clsx(
        'relative aspect-video w-full overflow-hidden rounded-xl border bg-black',
        isControlling && 'border-red-500 ring-2 ring-red-500/40',
        isDrawing && 'border-amber-500 ring-2 ring-amber-500/40',
        !isControlling && !isDrawing && 'border-gray-200 dark:border-slate-700',
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        /**
         * `object-contain` preserves the host's aspect ratio. The coordinate mapping in
         * `toNormalizedPoint` depends on it, since it accounts for the resulting bars.
         */
        className={clsx('size-full object-contain', isControlling && 'cursor-none')}
        {...controlHandlers}
      />

      {/* Sits exactly over the video; `useDrawCapture` maps normalised points onto it
          using the same letterboxing math as `toNormalizedPoint`. */}
      <canvas
        ref={canvasRef}
        className={clsx('absolute inset-0 size-full', isDrawing ? 'cursor-crosshair' : 'pointer-events-none')}
        {...drawHandlers}
      />

      {!hasStream && (
        <div className='absolute inset-0 grid place-items-center text-xs text-gray-400'>
          Waiting for the host&apos;s screen&hellip;
        </div>
      )}
    </div>
  );
}
