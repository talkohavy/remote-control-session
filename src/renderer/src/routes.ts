import { lazy } from 'react';
import type { Route } from './common/types';

const HomePage = lazy(() => import('./pages/HomePage'));
const HostPage = lazy(() => import('./pages/HostPage'));
const ViewerPage = lazy(() => import('./pages/ViewerPage'));
const OverlayPage = lazy(() => import('./pages/OverlayPage'));

export const routes: Array<Route> = [
  {
    to: 'home',
    text: 'Home',
    Component: HomePage,
  },
  {
    to: 'host',
    text: 'Share my screen',
    Component: HostPage,
  },
  {
    to: 'viewer',
    text: 'Connect to a screen',
    Component: ViewerPage,
  },
  /**
   * Never navigated to by the user - this is what the transparent annotation overlay
   * window (see `AnnotationOverlayService`) loads on the host's own desktop.
   */
  {
    to: 'overlay',
    text: 'Overlay',
    Component: OverlayPage,
    hideFromSidebar: true,
  },
];
