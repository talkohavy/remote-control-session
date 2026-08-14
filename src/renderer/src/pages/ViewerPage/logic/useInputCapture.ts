import { useCallback, useEffect, useRef } from 'react';
import { toMouseButton, toNormalizedPoint, toScrollDelta } from './to-normalized-point';
import type { RemoteInputEvent } from '@root/common/types';

type UseInputCaptureArgs = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isEnabled: boolean;
  onInput: (event: RemoteInputEvent) => void;
};

/**
 * Translates local pointer and keyboard activity into remote input events.
 *
 * Keyboard listeners sit on `window` rather than the video element: a `<video>` is not
 * focusable, and modifier-only presses would otherwise never be seen. Every handled event
 * is also prevented from doing its normal thing locally, so typing into a remote machine
 * does not simultaneously trigger this app's own shortcuts.
 */
export function useInputCapture({ videoRef, isEnabled, onInput }: UseInputCaptureArgs) {
  /**
   * Whatever this viewer has pressed down. If control is revoked, the window loses focus,
   * or the session ends while keys are held, the host would be left with a stuck modifier
   * unless we explicitly lift them.
   */
  const heldKeys = useRef(new Set<string>());

  const releaseHeldKeys = useCallback(() => {
    for (const code of heldKeys.current) {
      onInput({ type: 'keyUp', code });
    }

    heldKeys.current.clear();
  }, [onInput]);

  useEffect(() => {
    if (!isEnabled) {
      releaseHeldKeys();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      event.preventDefault();
      heldKeys.current.add(event.code);
      onInput({ type: 'keyDown', code: event.code });
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      event.preventDefault();
      heldKeys.current.delete(event.code);
      onInput({ type: 'keyUp', code: event.code });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', releaseHeldKeys);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', releaseHeldKeys);
      releaseHeldKeys();
    };
  }, [isEnabled, onInput, releaseHeldKeys]);

  const pointFrom = useCallback(
    (event: React.MouseEvent | React.WheelEvent) => {
      const video = videoRef.current;

      if (!video) return null;

      return toNormalizedPoint(video, event.clientX, event.clientY);
    },
    [videoRef],
  );

  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isEnabled) return;

      const point = pointFrom(event);

      if (point) onInput({ type: 'move', ...point });
    },
    [isEnabled, onInput, pointFrom],
  );

  const onMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!isEnabled) return;

      event.preventDefault();

      const point = pointFrom(event);
      const button = toMouseButton(event.button);

      if (point && button) onInput({ type: 'buttonDown', button, ...point });
    },
    [isEnabled, onInput, pointFrom],
  );

  const onMouseUp = useCallback(
    (event: React.MouseEvent) => {
      if (!isEnabled) return;

      event.preventDefault();

      const point = pointFrom(event);
      const button = toMouseButton(event.button);

      if (point && button) onInput({ type: 'buttonUp', button, ...point });
    },
    [isEnabled, onInput, pointFrom],
  );

  const onWheel = useCallback(
    (event: React.WheelEvent) => {
      if (!isEnabled) return;

      event.preventDefault();

      onInput({
        type: 'wheel',
        deltaX: toScrollDelta(event.deltaX),
        // Browser Y grows downward; the native scroll axis grows upward.
        deltaY: -toScrollDelta(event.deltaY),
      });
    },
    [isEnabled, onInput],
  );

  // Suppress the local context menu so a right-click reaches the host instead.
  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      if (isEnabled) event.preventDefault();
    },
    [isEnabled],
  );

  return { onMouseMove, onMouseDown, onMouseUp, onWheel, onContextMenu };
}
