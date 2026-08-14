import Button from '@renderer/components/controls/Button';
import Toggle from '@renderer/components/controls/Toggle';
import Panel from '@renderer/components/Panel';
import PermissionGate from './content/PermissionGate';
import SessionCredentials from './content/SessionCredentials';
import SourcePicker from './content/SourcePicker';
import ViewerList from './content/ViewerList';
import { useHostPageLogic } from './logic/useHostPageLogic';

export default function HostPage() {
  const {
    sources,
    selectedSourceId,
    setSelectedSourceId,
    isSharing,
    sessionCode,
    pin,
    controlAllowed,
    toggleControl,
    viewers,
    permissions,
    requestPermissions,
    startSharing,
    stopSharing,
  } = useHostPageLogic();

  const canInject = !permissions?.injectionUnavailableReason;

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-5 p-6 md:p-8'>
      <div>
        <h1 className='text-xl font-extrabold text-gray-900 dark:text-white'>Share my screen</h1>

        <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
          This desktop becomes the host. Viewers watch first and can only take over once you allow it.
        </p>
      </div>

      {permissions && <PermissionGate permissions={permissions} onRequest={requestPermissions} />}

      {isSharing ? (
        <>
          <Panel
            title='Session is live'
            subtitle='The viewer needs both values below.'
            action={<Button onClick={stopSharing}>Stop sharing</Button>}
          >
            <SessionCredentials sessionCode={sessionCode} pin={pin} />
          </Panel>

          <Panel
            title='Remote control'
            subtitle={
              canInject
                ? 'Off by default. While off, viewers can watch but cannot touch anything.'
                : 'Unavailable on this system - see the notice above.'
            }
          >
            <Toggle
              isChecked={controlAllowed}
              setIsChecked={(event) => toggleControl(Boolean(event?.target?.checked))}
              disabled={!canInject}
              label={controlAllowed ? 'Viewers can control this machine' : 'View only'}
            />

            {controlAllowed && (
              <p className='text-xs font-medium text-red-600 dark:text-red-400'>
                Your mouse and keyboard are being driven remotely. Toggle off to take back control.
              </p>
            )}
          </Panel>

          <Panel title='Connected viewers'>
            <ViewerList viewers={viewers} />
          </Panel>
        </>
      ) : (
        <Panel title='Choose what to share' subtitle='Pick a screen or a single window.'>
          <SourcePicker sources={sources} selectedSourceId={selectedSourceId} onSelect={setSelectedSourceId} />

          <div>
            <Button onClick={startSharing}>Start sharing</Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
