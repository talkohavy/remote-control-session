import Button from '@renderer/components/controls/Button';
import Panel from '@renderer/components/Panel';
import { ipcClient } from '@renderer/lib/ipc';
import type { PermissionKind, PermissionState, RemotePermissions } from '@root/common/types';

type PermissionGateProps = {
  permissions: RemotePermissions;
  onRequest: () => void;
};

const ROWS: Array<{ kind: PermissionKind; label: string; why: string }> = [
  { kind: 'screenRecording', label: 'Screen Recording', why: 'Required to capture and stream this desktop.' },
  { kind: 'accessibility', label: 'Accessibility', why: 'Required to move the cursor and type on your behalf.' },
];

/**
 * Only rendered when something is actually missing. macOS is the only platform that gates
 * these, and a denied grant fails silently at the OS level - so surfacing it here is the
 * difference between "remote control is broken" and "click this button".
 */
export default function PermissionGate(props: PermissionGateProps): React.JSX.Element | null {
  const { permissions, onRequest } = props;

  const missing = ROWS.filter(({ kind }) => needsAttention(permissions[kind]));
  const hasBlocker = missing.length > 0 || permissions.injectionUnavailableReason;

  if (!hasBlocker) return null;

  return (
    <Panel
      title='Permissions needed'
      subtitle='The operating system has to allow this before a session can work.'
      className='border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/30'
    >
      {missing.length > 0 && (
        <ul className='flex flex-col gap-3'>
          {missing.map(({ kind, label, why }) => (
            <li key={kind} className='flex items-center justify-between gap-3'>
              <div>
                <p className='text-xs font-semibold text-gray-900 dark:text-white'>{label}</p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>{why}</p>
              </div>

              <Button onClick={() => ipcClient.remote.openPermissionSettings(kind)}>Open Settings</Button>
            </li>
          ))}
        </ul>
      )}

      {permissions.injectionUnavailableReason && (
        <p className='text-xs leading-relaxed text-amber-800 dark:text-amber-200'>
          {permissions.injectionUnavailableReason}
        </p>
      )}

      {missing.length > 0 && (
        <div className='flex items-center gap-3'>
          <Button onClick={onRequest}>Request access</Button>

          <p className='text-xs text-gray-500 dark:text-gray-400'>
            macOS may require restarting the app after granting.
          </p>
        </div>
      )}
    </Panel>
  );
}

function needsAttention(state: PermissionState): boolean {
  return state === 'denied' || state === 'unknown';
}
