import { BrowserWindow, globalShortcut, Notification } from 'electron';

type RegisterGlobalShortcutsOptions = {
  /**
   * Force-dismisses the annotation overlay window. A full-screen, always-on-top window
   * that renders wrong (see `AnnotationOverlayService`) is exactly the kind of bug a user
   * cannot click their way out of - this is the physical escape hatch for that case,
   * independent of anything going on in the (possibly invisible) renderer.
   */
  onPanic: () => void;
};

export function registerGlobalShortcuts(options: RegisterGlobalShortcutsOptions): void {
  globalShortcut.register('CommandOrControl+Shift+6', () => {
    BrowserWindow.getAllWindows()[0]?.show();
  });

  globalShortcut.register('CommandOrControl+Shift+Escape', options.onPanic);

  globalShortcut.register('CommandOrControl+Shift+7', () => {
    new Notification({
      title: 'New Message',
      subtitle: 'From John Doe',
      body: 'Hey, how are you?',
      replyPlaceholder: 'Type your reply here...',
      hasReply: true, // <--- adds a reply input to the notification
      // sound: 'Glass', // <--- Available sounds: 'Glass', 'Bottle', 'Frog', 'Submarine'
      // closeButtonText: 'Close', // <--- adds a close button to the notification
      // actions: [
      //   {
      //     type: 'button',
      //     text: 'Ok',
      //   },
      // ],
    }).show();
  });
}
