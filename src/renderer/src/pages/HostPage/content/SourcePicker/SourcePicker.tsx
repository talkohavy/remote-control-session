import clsx from 'clsx';
import type { CaptureSource } from '@root/common/types';

type SourcePickerProps = {
  sources: CaptureSource[];
  selectedSourceId: string | null;
  onSelect: (sourceId: string) => void;
};

export default function SourcePicker(props: SourcePickerProps): React.JSX.Element {
  const { sources, selectedSourceId, onSelect } = props;

  /**
   * PipeWire hands back a single opaque source and shows its own picker when capture
   * begins, so there is nothing meaningful to list on Wayland.
   */
  if (sources.length === 0) {
    return (
      <p className='text-xs text-gray-500 dark:text-gray-400'>
        Your system will ask which screen or window to share when you start.
      </p>
    );
  }

  return (
    <ul className='grid max-h-72 grid-cols-2 gap-3 overflow-y-auto scrollbar-thin'>
      {sources.map((source) => (
        <li key={source.id}>
          <button
            type='button'
            onClick={() => onSelect(source.id)}
            className={clsx(
              'flex w-full flex-col gap-2 rounded-lg border p-2 text-left transition',
              source.id === selectedSourceId
                ? 'border-blue-500 ring-2 ring-blue-500/30'
                : 'border-gray-200 hover:border-gray-400 dark:border-slate-700 dark:hover:border-slate-500',
            )}
          >
            {source.thumbnailDataUrl ? (
              <img
                src={source.thumbnailDataUrl}
                alt={source.name}
                className='h-24 w-full rounded bg-gray-100 object-contain dark:bg-slate-900'
              />
            ) : (
              <div className='h-24 w-full rounded bg-gray-100 dark:bg-slate-900' />
            )}

            <span className='truncate text-xs text-gray-700 dark:text-gray-300' title={source.name}>
              {source.kind === 'screen' ? '\u{1F5A5}\uFE0F' : '\u{1FA9F}'} {source.name}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
