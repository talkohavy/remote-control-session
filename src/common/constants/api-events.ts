export const ApiEvents = {
  // System
  SystemGetInfo: 'system:getInfo',

  // Menu
  MenuCommand: 'menu:command',
  MenuShowContext: 'menu:showContextMenu',

  // Screen capture (host side)
  CaptureListSources: 'capture:listSources',
  CaptureSelectSource: 'capture:selectSource',

  // Remote input injection (host side)
  RemoteGetScreenSize: 'remote:getScreenSize',
  RemoteGetPermissions: 'remote:getPermissions',
  RemoteRequestPermissions: 'remote:requestPermissions',
  RemoteOpenPermissionSettings: 'remote:openPermissionSettings',
  RemoteSetControlAllowed: 'remote:setControlAllowed',
  RemoteInput: 'remote:input',
  RemoteReleaseAll: 'remote:releaseAll',

  // Live annotation overlay (host side)
  /** Host -> main: which physical display to overlay, sent once when sharing starts. */
  AnnotationSetActiveDisplay: 'annotation:setActiveDisplay',
  /** Host -> main: sharing stopped, hide the overlay. */
  AnnotationClearActiveDisplay: 'annotation:clearActiveDisplay',
  /** Host -> main (hot path) -> overlay window (push). */
  AnnotationStrokeStart: 'annotation:strokeStart',
  AnnotationStrokePoint: 'annotation:strokePoint',
  AnnotationStrokeEnd: 'annotation:strokeEnd',
  AnnotationClear: 'annotation:clear',
  /** Overlay window -> main (request/response): corrects for the window being clamped below the menu bar. */
  AnnotationGetDisplayOffset: 'annotation:getDisplayOffset',
} as const;

export type ApiEventValues = (typeof ApiEvents)[keyof typeof ApiEvents];
