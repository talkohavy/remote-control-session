import type { PropsWithChildren } from 'react';
import clsx from 'clsx';
import styles from './Main.module.scss';

export default function Main(props: PropsWithChildren) {
  const { children } = props;

  return (
    <main
      className={clsx(styles.main, 'flex size-full items-start justify-between overflow-auto pt-1 dark:text-white')}
    >
      {children}
    </main>
  );
}
