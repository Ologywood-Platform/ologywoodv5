import React from 'react';
import { ToastProvider } from './components/ErrorToast';
import App from './App';

/**
 * App Wrapper Component
 * Provides Toast context and other global providers
 */
export const AppWrapper: React.FC = () => {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
};

export default AppWrapper;
