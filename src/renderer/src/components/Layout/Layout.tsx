import type { PropsWithChildren } from 'react';
import { Toaster } from 'sonner';
import Header from './Header';
import Main from './Main';

type LayoutProps = PropsWithChildren;

export default function Layout(props: LayoutProps) {
  const { children } = props;

  return (
    <div className='flex size-full flex-col items-start justify-start'>
      <Header />

      <div className='flex size-full items-center justify-start overflow-auto'>
        <Main>{children}</Main>
      </div>

      <Toaster />
    </div>
  );
}
