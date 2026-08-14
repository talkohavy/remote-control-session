import { isWayland } from '@main/modules/screen-capture/logic/is-wayland';
import { desktopCapturer, shell, systemPreferences } from 'electron';
import type { PermissionKind, PermissionState, RemotePermissions } from '@root/common/types';

const MAC_SETTINGS_URLS: Record<PermissionKind, string> = {
  screenRecording: 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture',
  accessibility: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
};

/**
 * Reports whether this machine is actually allowed to capture the screen and drive the
 * cursor, using Electron's built-in checks rather than a native permissions addon.
 *
 * Only macOS gates these behind a user grant. Windows and X11 allow both outright, and
 * Wayland is the awkward case: capture works through the portal, but injection does not.
 */
export class PermissionsService {
  getPermissions(): RemotePermissions {
    return {
      screenRecording: this.screenRecordingState(),
      accessibility: this.accessibilityState(false),
      injectionUnavailableReason: this.injectionUnavailableReason(),
    };
  }

  /**
   * Same report, but asks the OS to show its grant prompts first. Split from
   * `getPermissions` so merely rendering the UI never triggers a system dialog.
   */
  async requestPermissions(): Promise<RemotePermissions> {
    /**
     * macOS has no "ask for screen recording" API - the prompt is raised by the first real
     * capture attempt. Enumerating sources is the cheapest way to trigger it.
     */
    if (process.platform === 'darwin') {
      await desktopCapturer
        .getSources({ types: ['screen'], thumbnailSize: { width: 1, height: 1 } })
        .catch(() => undefined);
    }

    return {
      screenRecording: this.screenRecordingState(),
      accessibility: this.accessibilityState(true),
      injectionUnavailableReason: this.injectionUnavailableReason(),
    };
  }

  openSettings(kind: PermissionKind): void {
    if (process.platform !== 'darwin') return;

    shell.openExternal(MAC_SETTINGS_URLS[kind]);
  }

  private screenRecordingState(): PermissionState {
    if (process.platform !== 'darwin') return 'not-required';

    const status = systemPreferences.getMediaAccessStatus('screen');

    if (status === 'granted') return 'granted';
    if (status === 'denied' || status === 'restricted') return 'denied';

    return 'unknown';
  }

  /**
   * `isTrustedAccessibilityClient(true)` both reports the state and asks the system to
   * surface its prompt, so the flag is only set when the user asked for a request.
   */
  private accessibilityState(shouldPrompt: boolean): PermissionState {
    if (process.platform !== 'darwin') return 'not-required';

    return systemPreferences.isTrustedAccessibilityClient(shouldPrompt) ? 'granted' : 'denied';
  }

  private injectionUnavailableReason(): string | null {
    if (!isWayland()) return null;

    return 'Input injection is unavailable on Wayland: the native backend drives X11/XTest. Screen sharing still works. Log into an X11 session to enable remote control.';
  }
}
