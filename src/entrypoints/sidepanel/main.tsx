import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/assets/styles/tailwind.css';
import { AppShell } from '@/ui/app-shell';

const container = document.querySelector('#root');
if (container === null) {
  throw new Error('Side panel root element #root not found');
}

createRoot(container).render(
  <StrictMode>
    <AppShell version={browser.runtime.getManifest().version} />
  </StrictMode>,
);
