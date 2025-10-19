import { useState, useEffect } from 'react';
import { subscribeToNotifications, dismissNotification, NOTIFICATION_TYPES } from '../utils/notifications';

// Toast container that manages multiple toasts
export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Subscribe to notification events
    const unsubscribe = subscribeToNotifications((event) => {
      if (event.type === 'add') {
        setToasts(prev => [...prev, event.notification]);
      } else if (event.type === 'remove') {
        setToasts(prev => prev.filter(t => t.id !== event.id));
      } else if (event.type === 'clear') {
        setToasts([]);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div className="fixed bottom-4 right-4 md:right-4 left-4 md:left-auto z-50 flex flex-col gap-2 max-w-md md:w-full w-auto pointer-events-none">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={() => dismissNotification(toast.id)}
        />
      ))}
    </div>
  );
}

// Individual toast notification
function Toast({ toast, onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300); // Match animation duration
  };

  // Get colors and icons based on type
  const getTypeStyles = () => {
    switch (toast.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return {
          bg: 'bg-success-50 dark:bg-success-900/30 border-success-500',
          icon: '✓',
          iconBg: 'bg-success-500 dark:bg-success-600',
          text: 'text-success-800 dark:text-success-300'
        };
      case NOTIFICATION_TYPES.ERROR:
        return {
          bg: 'bg-danger-50 dark:bg-danger-900/30 border-danger-500',
          icon: '✕',
          iconBg: 'bg-danger-500 dark:bg-danger-600',
          text: 'text-danger-800 dark:text-danger-300'
        };
      case NOTIFICATION_TYPES.WARNING:
        return {
          bg: 'bg-warning-50 dark:bg-warning-900/30 border-warning-500',
          icon: '⚠',
          iconBg: 'bg-warning-500 dark:bg-warning-600',
          text: 'text-warning-800 dark:text-warning-300'
        };
      case NOTIFICATION_TYPES.INFO:
      default:
        return {
          bg: 'bg-info-50 dark:bg-info-900/30 border-info-500',
          icon: 'ℹ',
          iconBg: 'bg-info-500 dark:bg-info-600',
          text: 'text-info-800 dark:text-info-300'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`
        ${styles.bg} ${styles.text}
        border-l-4 rounded-lg shadow-lg dark:shadow-xl dark:shadow-black/20 p-4 mb-2
        flex items-start gap-3
        pointer-events-auto
        transition-all duration-300 ease-in-out
        ${isExiting ? 'opacity-0 translate-y-full' : 'opacity-100 translate-y-0'}
        animate-slide-in
      `}
      role="alert"
    >
      {/* Icon */}
      <div className={`${styles.iconBg} text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold`}>
        {styles.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">
          {toast.message}
        </p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action.onClick();
              handleDismiss();
            }}
            className="mt-2 text-sm underline hover:no-underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 flex-shrink-0 text-lg leading-none"
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  );
}

// Add animation styles to index.css
// @keyframes slide-in {
//   from {
//     transform: translateX(100%);
//     opacity: 0;
//   }
//   to {
//     transform: translateX(0);
//     opacity: 1;
//   }
// }
// .animate-slide-in {
//   animation: slide-in 0.3s ease-out;
// }
