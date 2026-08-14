import BackButton from '@renderer/components/BackButton';
import Button from '@renderer/components/controls/Button';
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
    captureKind,
    isDrawing,
    setIsDrawing,
    drawColor,
    setDrawColor,
    drawWidth,
    setDrawWidth,
    clearSignal,
    clearDrawing,
    connect,
    disconnect,
    sendInput,
    sendDrawStart,
    sendDrawPoint,
    sendDrawEnd,
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

      {status === 'connected' && captureKind === 'screen' && (
        <Panel
          title='Draw'
          subtitle={
            controlAllowed
              ? 'Draw on the host\u2019s screen while the mouse button is held down.'
              : 'The host has not granted control yet - drawing needs the same permission.'
          }
        >
          <Toggle
            isChecked={isDrawing}
            setIsChecked={(event) => setIsDrawing(Boolean(event?.target?.checked))}
            disabled={!controlAllowed}
            label={isDrawing ? 'Drawing on the host\u2019s screen' : 'Not drawing'}
          />

          <div className='flex flex-wrap items-center gap-4'>
            <label className='flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300'>
              Color
              <input
                type='color'
                value={drawColor}
                onChange={(event) => setDrawColor(event.target.value)}
                className='size-7 cursor-pointer rounded border border-gray-300 dark:border-slate-600'
              />
            </label>

            <label className='flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300'>
              Width
              <input
                type='range'
                min={1}
                max={20}
                value={drawWidth}
                onChange={(event) => setDrawWidth(Number(event.target.value))}
                className='w-28'
              />
              <span className='w-4 text-right'>{drawWidth}</span>
            </label>

            <Button onClick={clearDrawing}>Clear</Button>
          </div>
        </Panel>
      )}

      <RemoteScreen
        videoRef={videoRef}
        hasStream={hasStream}
        isControlling={isControlling}
        onInput={sendInput}
        isDrawing={isDrawing}
        drawColor={drawColor}
        drawWidth={drawWidth}
        clearSignal={clearSignal}
        onDrawStart={sendDrawStart}
        onDrawPoint={sendDrawPoint}
        onDrawEnd={sendDrawEnd}
      />
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
