import DarkModeToggle from './DarkModeToggle';

export default function Header() {
  return (
    <header className='relative flex h-15 gap-4 px-3 w-full items-center justify-start border-b border-blue-800/50 bg-linear-to-tl from-blue-600 via-blue-500 to-sky-400 shadow-sm dark:from-blue-900 dark:via-blue-800 dark:to-slate-800 dark:shadow-dark-sm'>
      <DarkModeToggle />
    </header>
  );
}
