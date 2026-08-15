import { desktopCapturer, session } from 'electron';
import { THUMBNAIL_SIZE, WAYLAND_PLACEHOLDER_SOURCE } from '../logic/constants';
import { isWayland } from '../logic/is-wayland';
import type { CaptureSource } from '@root/common/types';

export class ScreenCaptureService {
  private selectedSourceId: string | null = null;

  /**
   * Installs the handler that resolves the renderer's `getDisplayMedia()` call.
   *
   * Must run before the renderer requests a stream, so it is called at module init.
   */
  installDisplayMediaHandler(): void {
    session.defaultSession.setDisplayMediaRequestHandler(
      async (_request, callback) => {
        /**
         * On Wayland, enumerating sources opens a portal session that the subsequent
         * capture cannot reuse - the user would be asked to pick a screen twice. Handing
         * back a placeholder skips enumeration entirely and lets the portal prompt once.
         */
        if (isWayland()) {
          callback({ video: WAYLAND_PLACEHOLDER_SOURCE });
          return;
        }

        const sources = await desktopCapturer.getSources({
          types: ['screen', 'window'],
          thumbnailSize: { width: 0, height: 0 },
        });

        const selected = sources.find((source) => source.id === this.selectedSourceId);
        const target = selected ?? sources[0];

        if (!target) {
          callback({});
          return;
        }

        callback({ video: target });
      },
      { useSystemPicker: false },
    );
  }

  async listSources(): Promise<CaptureSource[]> {
    /**
     * PipeWire returns a single opaque source and consumes a portal session doing it, so
     * there is nothing worth showing in an in-app picker. The portal's own picker runs
     * when capture starts instead.
     */
    if (isWayland()) return [];

    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: THUMBNAIL_SIZE,
    });

    return sources.map((source) => {
      const kind: CaptureSource['kind'] = source.id.startsWith('screen:') ? 'screen' : 'window';

      return {
        id: source.id,
        name: source.name,
        thumbnailDataUrl: source.thumbnail.isEmpty() ? null : source.thumbnail.toDataURL(),
        kind,
        // Only meaningful for screens - lets the annotation overlay target the right display.
        ...(kind === 'screen' && source.display_id ? { displayId: source.display_id } : {}),
      };
    });
  }

  selectSource(sourceId: string): void {
    this.selectedSourceId = sourceId;
  }
}
