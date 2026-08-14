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
} as const;

export type ApiEventValues = (typeof ApiEvents)[keyof typeof ApiEvents];
