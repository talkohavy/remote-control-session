import { Route } from 'react-router';
import type { Route as RouteType } from '@renderer/common/types';

export function routeRender(route: RouteType, index: number) {
  const { to: path, index: isIndex, Component, children } = route;

  if (children && children.length > 0) {
    return (
      <Route key={index} path={path} element={<Component />}>
        {children.map(routeRender)}
      </Route>
    );
  }

  // Simple route without children
  return <Route key={index} index={isIndex} path={path} element={<Component />} />;
}
