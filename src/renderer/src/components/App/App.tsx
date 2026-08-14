import { Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { BASE_URL } from '@renderer/common/constants';
import RedirectToHome from '@renderer/pages/RedirectToHome';
import { routes } from '@renderer/routes';
import Layout from '../Layout';
import { routeRender } from '../RouteRender';
import { useAppLogic } from './logic/useAppLogic';

/** Where the transparent annotation overlay window (a bare canvas) is loaded from. */
const OVERLAY_PATH = `${BASE_URL}/overlay`;

export default function App() {
  useAppLogic();

  const location = useLocation();
  const isOverlayWindow = location.pathname === OVERLAY_PATH;

  const content = (
    <Suspense>
      <Routes>
        <Route path={BASE_URL.substring(1)}>{routes.map(routeRender)}</Route>

        <Route path={'/'}>
          <Route index element={<RedirectToHome />} />
        </Route>
      </Routes>
    </Suspense>
  );

  /**
   * The overlay window must show nothing but its own transparent canvas - the header,
   * sidebar and toaster all paint opaque pixels that would otherwise blot out the host's
   * desktop underneath it.
   */
  if (isOverlayWindow) return content;

  return <Layout>{content}</Layout>;
}
