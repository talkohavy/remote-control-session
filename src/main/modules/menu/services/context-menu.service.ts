import { MenuCommands } from '@root/common/constants';
import { isMac } from '@root/common/utils/isMac';
import { Menu, shell, type BrowserWindow, type MenuItemConstructorOptions } from 'electron';
import type { MenuCommandSender, ContextMenuRequest } from '@root/common/types';

export class ContextMenuService {
  constructor(private readonly sendMenuCommand: MenuCommandSender) {}

  /**
   * Pops a native context menu at the cursor. Built fresh each time so it can
   * reflect the current selection (e.g. show "Search for ..." only when text
   * is selected). This is a transient menu - `popup()` not `setApplicationMenu`.
   */
  popupContext(window: BrowserWindow, request: ContextMenuRequest): void {
    const { x, y, selectionText, isDarkMode } = request;
    const hasSelection = Boolean(selectionText?.trim());

    const template: MenuItemConstructorOptions[] = [
      {
        label: isMac() ? '\u{1F311} Toggle Dark Mode' : '\u{1F311} Toggle Dark/Light',
        accelerator: 'CmdOrCtrl+D',
        click: () => {
          this.sendMenuCommand({
            type: MenuCommands.ToggleTheme,
            payload: { isDarkMode },
          });
        },
      },
      { type: 'separator' },
      { role: 'copy' },
      { role: 'paste' },
    ];

    if (hasSelection) {
      const snippet = selectionText!.trim().slice(0, 24);
      template.push(
        { type: 'separator' },
        {
          label: `\u{1F50D} Search web for "${snippet}${selectionText!.length > 24 ? '\u2026' : ''}"`,
          click: () => {
            shell.openExternal(`https://duckduckgo.com/?q=${encodeURIComponent(selectionText!.trim())}`);
          },
        },
      );
    }

    template.push(
      { type: 'separator' },
      { role: 'reload' },
      {
        label: '\u{1F50E} Inspect Element',
        click: () => {
          window.webContents.inspectElement(x, y);
        },
      },
    );

    const menu = Menu.buildFromTemplate(template);

    menu.popup({ window, x, y });
  }
}
