import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * React Error Boundary
 * Catches JavaScript errors in child component tree and displays a fallback UI.
 * Supports three levels: page (full-screen), section (card), component (inline).
 *
 * Usage:
 *   <ErrorBoundary level="page"><YourPage /></ErrorBoundary>
 *   <ErrorBoundary level="section"><DashboardWidget /></ErrorBoundary>
 *   <ErrorBoundary level="component"><SmallWidget /></ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking in production
    if (import.meta.env.PROD) {
      try {
        fetch('/api/error-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            url: window.location.href,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
      } catch {
        // Silently fail
      }
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const level = this.props.level || 'page';

    // Page-level error: full-page fallback
    if (level === 'page') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-8">
              We encountered an unexpected error. Please try refreshing the page
              or go back to the homepage.
            </p>
            {!import.meta.env.PROD && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <pre className="text-sm font-mono text-red-800 whitespace-pre-wrap break-all">
                  {this.state.error.stack || this.state.error.message}
                </pre>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReload} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                <Home className="w-4 h-4" />
                Go to Homepage
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Section-level error: contained card fallback
    if (level === 'section') {
      return (
        <div className="w-full p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 mb-1">
                This section encountered an error
              </h3>
              <p className="text-sm text-red-600 mb-3">
                The rest of the page should still work normally.
              </p>
              {!import.meta.env.PROD && this.state.error && (
                <p className="text-xs font-mono text-red-700 mb-3 break-all">
                  {this.state.error.message}
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={this.handleReset}
                className="gap-1 text-red-700 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="w-3 h-3" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Component-level error: minimal inline fallback
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>Failed to load</span>
        <button
          onClick={this.handleReset}
          className="underline hover:no-underline text-red-800 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }
}

/** Page-level error boundary wrapper */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="page">{children}</ErrorBoundary>;
}

/** Section-level error boundary wrapper */
export function SectionErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="section">{children}</ErrorBoundary>;
}

/** Component-level error boundary wrapper */
export function ComponentErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="component">{children}</ErrorBoundary>;
}

export default ErrorBoundary;
