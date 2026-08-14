import { Link } from 'react-router';
import { BASE_URL } from '@renderer/common/constants';
import Versions from '@renderer/components/Versions';

const ROLES = [
  {
    to: `${BASE_URL}/host`,
    emoji: '\u{1F5A5}\uFE0F',
    title: 'Share my screen',
    description: 'Stream this desktop and hand out a code. Control stays off until you allow it.',
  },
  {
    to: `${BASE_URL}/viewer`,
    emoji: '\u{1F5B1}\uFE0F',
    title: 'Connect to a screen',
    description: 'Enter a code and PIN to watch a remote desktop, and drive it once granted.',
  },
] as const;

export default function HomePage() {
  return (
    <div className='flex w-full flex-col items-center gap-8 p-6 md:p-8'>
      <div className='text-center'>
        <h1 className='text-2xl font-extrabold text-gray-900 dark:text-white'>Remote Control Session</h1>

        <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
          Screen sharing and remote control over WebRTC. Pick a side to begin.
        </p>
      </div>

      <div className='flex items-center justify-center gap-10 w-full sm:grid-cols-2'>
        {ROLES.map(({ to, emoji, title, description }) => (
          <Link
            key={to}
            to={to}
            className='group flex flex-col gap-2 max-w-xs rounded-xl border border-blue-100 bg-linear-to-tl from-white via-sky-50 to-blue-100 p-6 transition hover:border-slate-400 dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 dark:hover:border-blue-500'
          >
            <span className='text-3xl'>{emoji}</span>

            <span className='text-base font-semibold text-gray-900 dark:text-white'>{title}</span>

            <span className='text-xs leading-relaxed text-gray-500 dark:text-gray-400'>{description}</span>
          </Link>
        ))}
      </div>

      <Versions />
    </div>
  );
}
