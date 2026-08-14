import type { PropsWithChildren, ReactNode } from 'react';
import clsx from 'clsx';

type PanelProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}>;

export default function Panel(props: PanelProps): React.JSX.Element {
  const { title, subtitle, action, className, children } = props;

  return (
    <section
      className={clsx(
        'flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm dark:border-slate-700 dark:bg-slate-800',
        className,
      )}
    >
      <div className='flex items-start justify-between gap-3'>
        <div>
          <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>{title}</h2>

          {subtitle && <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-400'>{subtitle}</p>}
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}
