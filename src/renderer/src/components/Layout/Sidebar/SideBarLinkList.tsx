import { useMemo } from 'react';
import { BASE_URL } from '@renderer/common/constants';
import { routes as routesRaw } from '@renderer/routes';
import SideBarLinkItem from './SideBarLinkItem';

export default function SideBarLinkList() {
  const routes = useMemo(
    () =>
      routesRaw
        .filter((route) => !route.hideFromSidebar)
        .map(({ to, text }) => {
          const toWithBaseUrl = `${BASE_URL}/${to}`;

          return { to: toWithBaseUrl, text };
        }),
    [],
  );

  return (
    <div className='flex flex-col items-start justify-start text-sm font-thin'>
      {routes.map(({ to, text }) => (
        <SideBarLinkItem key={text} to={to} text={text} />
      ))}
    </div>
  );
}
