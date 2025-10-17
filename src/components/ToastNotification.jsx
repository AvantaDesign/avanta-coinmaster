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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
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
          bg: 'bg-green-50 border-green-500',
          icon: '✓',
          iconBg: 'bg-green-500',
          text: 'text-green-800'
        };
      case NOTIFICATION_TYPES.ERROR:
        return {
          bg: 'bg-red-50 border-red-500',
          icon: '✕',
          iconBg: 'bg-red-500',
          text: 'text-red-800'
        };
      case NOTIFICATION_TYPES.WARNING:
        return {
          bg: 'bg-yellow-50 border-yellow-500',
          icon: '⚠',
          iconBg: 'bg-yellow-500',
          text: 'text-yellow-800'
        };
      case NOTIFICATION_TYPES.INFO:
      default:
        return {
          bg: 'bg-blue-50 border-blue-500',
          icon: 'ℹ',
          iconBg: 'bg-blue-500',
          text: 'text-blue-800'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`
        ${styles.bg} ${styles.text}
        border-l-4 rounded-lg shadow-lg p-4 mb-2
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
        className="text-gray-500 hover:text-gray-700 flex-shrink-0 text-lg leading-none"
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
