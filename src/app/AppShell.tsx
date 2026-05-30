'use client';

import App from '../App';
import { AppProvider } from '../context/AppContext';

interface AppShellProps {
  initialDramaId?: string;
}

export default function AppShell({ initialDramaId }: AppShellProps) {
  return (
    <AppProvider initialDramaId={initialDramaId}>
      <App />
    </AppProvider>
  );
}
