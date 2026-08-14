import clsx from 'clsx';
import { useInputCapture } from '../../logic/useInputCapture';
import type { RemoteInputEvent } from '@root/common/types';

type RemoteScreenProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hasStream: boolean;
  isControlling: boolean;
  onInput: (event: RemoteInputEvent) => void;
};

export default function RemoteScreen(props: RemoteScreenProps): React.JSX.Element {
  const { videoRef, hasStream, isControlling, onInput } = props;

  const handlers = useInputCapture({ videoRef, isEnabled: isControlling, onInput });

  return (
    <div
      className={clsx(
        'relative aspect-video w-full overflow-hidden rounded-xl border bg-black',
        isControlling ? 'border-red-500 ring-2 ring-red-500/40' : 'border-gray-200 dark:border-slate-700',
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
        {...handlers}
      />

      {!hasStream && (
        <div className='absolute inset-0 grid place-items-center text-xs text-gray-400'>
          Waiting for the host&apos;s screen&hellip;
        </div>
      )}
    </div>
  );
}
