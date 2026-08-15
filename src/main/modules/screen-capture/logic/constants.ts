export const THUMBNAIL_SIZE = {
  width: 320,
  height: 200,
};

/**
 * Any non-empty id works here: PipeWire ignores it and shows its own picker. It exists
 * only to satisfy the callback's shape.
 */
export const WAYLAND_PLACEHOLDER_SOURCE = {
  id: 'screen:0:0',
  name: 'Screen',
};
