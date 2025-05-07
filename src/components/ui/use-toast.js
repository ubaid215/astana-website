'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react'; // Assuming you have lucide-react for icons

// Toast context
const ToastContext = createContext(undefined);

// Toast provider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, ...toast }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
              <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

// useToast hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast component
function Toast({ title, description, variant = 'default', duration = 5000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variantStyles = {
    default: 'bg-white text-gray-900 border-gray-200',
    destructive: 'bg-red-600 text-white border-red-700',
    success: 'bg-green-600 text-white border-green-700',
  };

  return (
    <div
      className={`max-w-sm w-full border rounded-lg shadow-lg p-4 flex items-start gap-4 animate-in slide-in-from-right-4 duration-300 ease-out ${variantStyles[variant]}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-1">
        {title && <h3 className="font-semibold">{title}</h3>}
        {description && <p className="text-sm">{description}</p>}
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-full hover:bg-opacity-20 hover:bg-gray-200"
        aria-label="Close toast"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}