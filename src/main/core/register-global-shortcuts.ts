import { BrowserWindow, globalShortcut, Notification } from 'electron';

export function registerGlobalShortcuts(): void {
  globalShortcut.register('CommandOrControl+Shift+6', () => {
    BrowserWindow.getAllWindows()[0]?.show();
  });

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
