import type { ConnectedViewer } from '@root/common/types';

type ViewerListProps = {
  viewers: ConnectedViewer[];
};

export default function ViewerList(props: ViewerListProps): React.JSX.Element {
  const { viewers } = props;

  if (viewers.length === 0) {
    return <p className='text-xs text-gray-500 dark:text-gray-400'>Nobody is connected yet.</p>;
  }

  return (
    <ul className='flex flex-col gap-2'>
      {viewers.map((viewer) => (
        <li
          key={viewer.peerId}
          className='flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-slate-700'
        >
          <span className='truncate text-xs text-gray-700 dark:text-gray-300'>{viewer.viewerName}</span>

          <span
            className={
              viewer.authenticated
                ? 'text-xs font-semibold text-green-600 dark:text-green-400'
                : 'text-xs font-semibold text-amber-600 dark:text-amber-400'
            }
          >
            {viewer.authenticated ? 'Authenticated' : 'Awaiting PIN'}
          </span>
        </li>
      ))}
    </ul>
  );
}
