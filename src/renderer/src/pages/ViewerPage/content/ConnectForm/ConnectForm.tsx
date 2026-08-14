import Button from '@renderer/components/controls/Button';
import Input from '@renderer/components/controls/Input';
import { normalizeSessionCode } from '@renderer/lib/peer';
import type { ConnectionStatus } from '@root/common/types';

type ConnectFormProps = {
  sessionCode: string;
  setSessionCode: (value: string) => void;
  pin: string;
  setPin: (value: string) => void;
  status: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
};

export default function ConnectForm(props: ConnectFormProps): React.JSX.Element {
  const { sessionCode, setSessionCode, pin, setPin, status, onConnect, onDisconnect } = props;

  const isBusy = status === 'connecting' || status === 'connected';

  return (
    <div className='flex flex-wrap items-end gap-3'>
      <label className='flex flex-col gap-1'>
        <span className='text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500'>Session code</span>

        <Input
          value={sessionCode}
          // Users read the code grouped ("123 456 789"), so strip anything non-numeric.
          onChange={(value) => setSessionCode(normalizeSessionCode(value))}
          placeholder='123 456 789'
          disabled={isBusy}
          className='w-40 font-mono tracking-widest'
        />
      </label>

      <label className='flex flex-col gap-1'>
        <span className='text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500'>PIN</span>

        <Input
          type='password'
          value={pin}
          onChange={(value) => setPin(normalizeSessionCode(value))}
          placeholder='------'
          disabled={isBusy}
          className='w-28 font-mono tracking-widest'
        />
      </label>

      {isBusy ? <Button onClick={onDisconnect}>Disconnect</Button> : <Button onClick={onConnect}>Connect</Button>}
    </div>
  );
}
