import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastNotification {
  id: string;
  type: 'error' | 'success' | 'info' | 'warning';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number; // 0 = persistent
  dismissible?: boolean;
}

interface ErrorToastProps {
  notification: ToastNotification;
  onDismiss: (id: string) => void;
}

/**
 * Individual toast notification component
 */
export const ErrorToast: React.FC<ErrorToastProps> = ({
  notification,
  onDismiss,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(notification.id), 300);
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.id, onDismiss]);

  const getIcon = () => {
    switch (notification.type) {
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'error':
        return 'text-red-600';
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
      default:
        return 'text-blue-600';
    }
  };

  const getActionButtonColor = () => {
    switch (notification.type) {
      case 'error':
        return 'bg-red-100 hover:bg-red-200 text-red-800';
      case 'success':
        return 'bg-green-100 hover:bg-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-100 hover:bg-blue-200 text-blue-800';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div
        className={`
          border rounded-lg shadow-lg p-4 max-w-md
          ${getBackgroundColor()}
        `}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${getIconColor()}`}>
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900">
              {notification.title}
            </h3>
            <p className="text-sm text-gray-700 mt-1">
              {notification.message}
            </p>

            {/* Action Button */}
            {notification.action && (
              <button
                onClick={() => {
                  notification.action!.onClick();
                  onDismiss(notification.id);
                }}
                className={`
                  mt-2 px-3 py-1 rounded text-sm font-medium
                  transition-colors duration-200
                  ${getActionButtonColor()}
                `}
              >
                {notification.action.label}
              </button>
            )}
          </div>

          {/* Close Button */}
          {notification.dismissible !== false && (
            <button
              onClick={() => {
                setIsExiting(true);
                setTimeout(() => onDismiss(notification.id), 300);
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Toast container component that displays multiple notifications
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({
  notifications,
  onDismiss,
  position = 'top-right',
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div
      className={`
        fixed ${getPositionClasses()} z-50
        flex flex-col gap-3 pointer-events-none
      `}
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <ErrorToast
            notification={notification}
            onDismiss={onDismiss}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Hook for managing toast notifications
 */
export const useToast = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = (
    notification: Omit<ToastNotification, 'id'>
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newNotification: ToastNotification = {
      ...notification,
      id,
      dismissible: notification.dismissible !== false,
      duration: notification.duration ?? 5000,
    };

    setNotifications((prev) => [...prev, newNotification]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addError = (
    title: string,
    message: string,
    action?: ToastNotification['action']
  ) => {
    return addNotification({
      type: 'error',
      title,
      message,
      action,
      duration: 7000,
    });
  };

  const addSuccess = (
    title: string,
    message: string,
    action?: ToastNotification['action']
  ) => {
    return addNotification({
      type: 'success',
      title,
      message,
      action,
      duration: 4000,
    });
  };

  const addWarning = (
    title: string,
    message: string,
    action?: ToastNotification['action']
  ) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      action,
      duration: 5000,
    });
  };

  const addInfo = (
    title: string,
    message: string,
    action?: ToastNotification['action']
  ) => {
    return addNotification({
      type: 'info',
      title,
      message,
      action,
      duration: 4000,
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    addError,
    addSuccess,
    addWarning,
    addInfo,
  };
};

/**
 * Context for toast notifications
 */
export const ToastContext = React.createContext<
  ReturnType<typeof useToast> | undefined
>(undefined);

/**
 * Provider component for toast notifications
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer
        notifications={toast.notifications}
        onDismiss={toast.removeNotification}
      />
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast context
 */
export const useToastContext = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
};
