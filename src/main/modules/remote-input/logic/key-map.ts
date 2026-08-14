/**
 * Maps the browser's `KeyboardEvent.code` (physical key position, layout-independent)
 * onto libnut's key names.
 *
 * `code` rather than `key` is deliberate: `key` is what the character *would* be under the
 * viewer's keyboard layout, which is not necessarily the host's. Sending the physical
 * position lets the host apply its own layout, so a Dvorak viewer driving a QWERTY host
 * produces what the host's user expects.
 */
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

function buildStaticMap(): Record<string, string> {
  const map: Record<string, string> = {
    Space: 'space',
    Escape: 'escape',
    Tab: 'tab',
    Enter: 'enter',
    NumpadEnter: 'enter',
    Backspace: 'backspace',
    Delete: 'delete',
    Insert: 'insert',
    Home: 'home',
    End: 'end',
    PageUp: 'pageup',
    PageDown: 'pagedown',
    ArrowLeft: 'left',
    ArrowUp: 'up',
    ArrowRight: 'right',
    ArrowDown: 'down',
    PrintScreen: 'printscreen',
    CapsLock: 'caps_lock',
    ScrollLock: 'scroll_lock',
    NumLock: 'num_lock',
    ContextMenu: 'menu',

    // Punctuation - libnut names these by the character they produce.
    Backquote: '`',
    Minus: '-',
    Equal: '=',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Semicolon: ';',
    Quote: "'",
    Comma: ',',
    Period: '.',
    Slash: '/',

    // Modifiers. libnut distinguishes left from right.
    ShiftLeft: 'shift',
    ShiftRight: 'right_shift',
    ControlLeft: 'control',
    ControlRight: 'right_control',
    AltLeft: 'alt',
    AltRight: 'right_alt',

    NumpadDecimal: 'numpad_decimal',
    NumpadEqual: 'numpad_equal',
    NumpadAdd: 'add',
    NumpadSubtract: 'subtract',
    NumpadMultiply: 'multiply',
    NumpadDivide: 'divide',
  };

  for (const letter of LETTERS) {
    map[`Key${letter.toUpperCase()}`] = letter;
  }

  for (let digit = 0; digit <= 9; digit += 1) {
    map[`Digit${digit}`] = String(digit);
    map[`Numpad${digit}`] = `numpad_${digit}`;
  }

  for (let fn = 1; fn <= 24; fn += 1) {
    map[`F${fn}`] = `f${fn}`;
  }

  /**
   * The Meta/Super key has a different libnut name on every platform, and it is the host's
   * platform that decides - the event is being injected there.
   */
  const metaByPlatform: Record<string, readonly [string, string]> = {
    darwin: ['cmd', 'right_cmd'],
    win32: ['win', 'right_win'],
    linux: ['meta', 'right_meta'],
  };

  const [metaLeft, metaRight] = metaByPlatform[process.platform] ?? metaByPlatform['linux']!;

  map['MetaLeft'] = metaLeft;
  map['MetaRight'] = metaRight;
  map['OSLeft'] = metaLeft;
  map['OSRight'] = metaRight;

  return map;
}

const CODE_TO_LIBNUT_KEY = buildStaticMap();

export function toLibnutKey(code: string): string | null {
  return CODE_TO_LIBNUT_KEY[code] ?? null;
}
