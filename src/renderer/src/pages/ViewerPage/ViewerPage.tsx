import BackButton from '@renderer/components/BackButton';
import Toggle from '@renderer/components/controls/Toggle';
import Panel from '@renderer/components/Panel';
import ConnectForm from './content/ConnectForm';
import RemoteScreen from './content/RemoteScreen';
import { useViewerPageLogic } from './logic/useViewerPageLogic';

export default function ViewerPage() {
  const {
    videoRef,
    sessionCode,
    setSessionCode,
    pin,
    setPin,
    status,
    hasStream,
    controlAllowed,
    isControlling,
    setIsControlling,
    connect,
    disconnect,
    sendInput,
  } = useViewerPageLogic();

  return (
    <div className='flex w-full flex-col gap-5 p-6 md:p-8'>
      <BackButton />

      <div>
        <h1 className='text-xl font-extrabold text-gray-900 dark:text-white'>Connect to a screen</h1>

        <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>Ask the host for their session code and PIN.</p>
      </div>

      <Panel title='Session' subtitle={STATUS_LABELS[status]}>
        <ConnectForm
          sessionCode={sessionCode}
          setSessionCode={setSessionCode}
          pin={pin}
          setPin={setPin}
          status={status}
          onConnect={connect}
          onDisconnect={disconnect}
        />
      </Panel>

      {status === 'connected' && (
        <Panel
          title='Remote control'
          subtitle={
            controlAllowed
              ? 'The host has granted control. Enable capture to drive their machine.'
              : 'The host has not granted control yet - you can watch only.'
          }
        >
          <Toggle
            isChecked={isControlling}
            setIsChecked={(event) => setIsControlling(Boolean(event?.target?.checked))}
            disabled={!controlAllowed}
            label={isControlling ? 'Capturing your mouse and keyboard' : 'Not capturing input'}
          />

          {isControlling && (
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              Keystrokes go to the remote machine instead of this app. Toggle off to get your keyboard back.
            </p>
          )}
        </Panel>
      )}

      <RemoteScreen videoRef={videoRef} hasStream={hasStream} isControlling={isControlling} onInput={sendInput} />
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  idle: 'Not connected.',
  connecting: 'Connecting\u2026',
  connected: 'Connected.',
  error: 'Something went wrong - check the code and PIN.',
  closed: 'Session ended.',
};
