// Sentry monitoring disabled - optional error tracking service
// Can be re-enabled by installing compatible version of @sentry/node

export async function initializeSentry(): Promise<boolean> {
  
  return false;
}

export async function captureException(error: Error, context?: Record<string, any>): Promise<string> {
  console.error('[Error]', error.message);
  return '';
}

export async function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info', context?: Record<string, any>): Promise<string> {
  
  return '';
}

export async function startTransaction(name: string, op: string = 'http.request'): Promise<any> {
  return null;
}

export async function setUserContext(userId: string, email?: string, username?: string): Promise<void> {}

export async function clearUserContext(): Promise<void> {}

export async function addBreadcrumb(message: string, category: string = 'user-action', level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info', data?: Record<string, any>): Promise<void> {}

export function isSentryInitialized(): boolean {
  return false;
}

export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  return false;
}

export async function getSentryMiddleware(): Promise<any> {
  return (req: any, res: any, next: any) => next();
}

export async function getSentryErrorHandler(): Promise<any> {
  return (err: any, req: any, res: any, next: any) => next(err);
}
