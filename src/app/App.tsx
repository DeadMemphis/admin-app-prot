import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { HistoryProvider } from './contexts/HistoryContext';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <ThemeProvider>
      <HistoryProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </HistoryProvider>
    </ThemeProvider>
  );
}