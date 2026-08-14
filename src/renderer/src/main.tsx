import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import App from './components/App';
import DarkThemeProvider from './providers/DarkThemeProvider';
import './common/styles/main.css';
import './common/styles/toast.css';
import './index.css';

/**
 * Hash routing, not history routing. A packaged build is loaded from `file://`, where
 * `location.pathname` is the absolute path of index.html - so no `/base/*` route would ever
 * match and every page would render blank. The hash is the only part of a `file://` URL that
 * behaves the same as it does under the dev server.
 */
// eslint-disable-next-line
function Client() {
  return (
    <StrictMode>
      <HashRouter>
        <DarkThemeProvider>
          <App />
        </DarkThemeProvider>
      </HashRouter>
    </StrictMode>
  );
}

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);
root.render(<Client />);
