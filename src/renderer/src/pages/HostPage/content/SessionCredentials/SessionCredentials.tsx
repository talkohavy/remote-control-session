import { showSuccessToast } from '@renderer/common/utils/toast';
import { formatSessionCode } from '@renderer/lib/peer';

type SessionCredentialsProps = {
  sessionCode: string;
  pin: string;
};

export default function SessionCredentials(props: SessionCredentialsProps): React.JSX.Element {
  const { sessionCode, pin } = props;

  const copy = (label: string, value: string): void => {
    navigator.clipboard.writeText(value);
    showSuccessToast({ title: `${label} copied` });
  };

  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
      <Credential
        label='Session code'
        value={formatSessionCode(sessionCode)}
        hint='Share freely - it only identifies this session.'
        onCopy={() => copy('Session code', sessionCode)}
      />

      <Credential
        label='PIN'
        value={pin}
        hint='Treat as a password. It is what actually authorises a viewer.'
        onCopy={() => copy('PIN', pin)}
      />
    </div>
  );
}

type CredentialProps = {
  label: string;
  value: string;
  hint: string;
  onCopy: () => void;
};

function Credential(props: CredentialProps): React.JSX.Element {
  const { label, value, hint, onCopy } = props;

  return (
    <div className='rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-900/60'>
      <div className='flex items-center justify-between gap-2'>
        <p className='text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500'>{label}</p>

        <button
          type='button'
          onClick={onCopy}
          className='text-xs text-blue-600 hover:underline dark:text-blue-400'
          aria-label={`Copy ${label}`}
        >
          Copy
        </button>
      </div>

      <p className='mt-1 font-mono text-xl font-bold tracking-widest text-gray-900 select-all dark:text-white'>
        {value}
      </p>

      <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>{hint}</p>
    </div>
  );
}
